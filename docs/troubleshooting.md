# Troubleshooting Guide

All known bugs encountered during the development and deployment of OctoWrap — with exact error messages, root cause analysis, and the fixes applied.

---

## Bug #1 — `configId: undefined` after image upload

### Symptom

Image upload progress bar reaches 100%, but the user is never redirected to `/configure/design`. The browser console shows:

```
Upload progress: 100
Upload reached 100%, waiting for completion callback...
Upload completion callback didn't trigger, forcing completion...
Upload completed callback triggered: Object
Object
Extracted Config ID: undefined
No configId in response. Full response: Object
```

The toast shows: **"Configuration ID not received"**

### Error Source

`app/configure/upload/page.tsx` → `onClientUploadComplete` callback:

```typescript
const configId = data?.serverData?.configId;
// configId is undefined ↑
```

### Root Cause

**The `Configuration` table did not exist in the new PostgreSQL database.**

When `DATABASE_URL` was changed to a new Aiven Postgres instance, the database was completely empty — no tables. When `onUploadComplete` in `core.ts` ran `prisma.configuration.create(...)`, Prisma threw a database error (table not found). The error was silently swallowed within UploadThing's internal error handling, so the `onUploadComplete` callback returned `undefined` instead of `{ configId }`.

### Secondary Cause

`core.ts` had two different Prisma client instances:

```typescript
import { db } from "@/db";          // ← shared singleton
const prisma = new PrismaClient();   // ← standalone duplicate

// create() used standalone prisma
const configuration = await prisma.configuration.create(...);

// update() used shared db
const updated = await db.configuration.update(...);
```

Using two different clients can cause connection pool exhaustion and inconsistent behavior under load.

### Fix

**Step 1:** Push the Prisma schema to the new database:
```bash
npx prisma db push
npx prisma generate
```

**Step 2:** Remove the duplicate `PrismaClient` from `core.ts` and use the shared `db` singleton throughout:

```typescript
// Before
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.configuration.create(...)

// After
import { db } from "@/db";
await db.configuration.create(...)
```

---

## Bug #2 — Foreign Key Constraint Violation on Checkout

### Symptom

Clicking "Check out" on the preview page shows the toast: **"There was an error on our end. Please try again."**

Vercel logs show:
```
2026-05-20 08:24:11.310 [error] Error creating checkout session:
Invalid `prisma.order.create()` invocation:
Foreign key constraint violated: `Order_userId_fkey (index)`
```

With the Clerk user ID logged:
```
2026-05-20 08:24:10.895 [info] user_2tqYV1m8KThz0NwKpn4MtX59YsD
```

### Root Cause — Two Layers

#### Layer 1: Empty Database

After switching `DATABASE_URL` to a new Aiven Postgres instance, the `User` table was empty. Clerk still had all existing user accounts, but there was no corresponding row in the database's `User` table. When `order.create()` tried to link `userId: "user_2tq..."` to `User.id`, the foreign key constraint failed because that user ID didn't exist.

#### Layer 2: Auth-Callback Bug (Logic Error)

`app/auth-callback/page.tsx` contained a logic error:

```typescript
// BROKEN — the enabled condition disabled user creation in the checkout flow
const { data } = useQuery({
  queryKey: ["auth-callback"],
  queryFn: async () => await getAuthStatus(), // ← creates User in DB
  retry: true,
  retryDelay: 500,
  enabled: !configId, // ← if configId exists, this never runs!
});
```

The checkout login flow works like this:
1. User clicks "Check out" while not signed in
2. `configurationId` is saved to `localStorage`
3. The login modal opens
4. User signs in → Clerk redirects to `/auth-callback`
5. In the auth-callback page, `configId` is read from `localStorage` → it's truthy
6. `enabled: !configId` → `enabled: false` → **the query never runs**
7. `getAuthStatus()` is never called → **User is never created in the DB**
8. User is redirected to `/configure/preview` and clicks "Check out"
9. `order.create()` fails with foreign key violation ❌

### Fix

**Fix 1:** Add `db.user.upsert()` in `createCheckoutSession()` as a safety net:

```typescript
// app/configure/preview/actions.ts
const userId = user.id;
const userEmail = user.emailAddresses?.[0]?.emailAddress ?? "";

// Ensure user exists regardless of how they logged in
await db.user.upsert({
  where: { id: userId },
  create: { id: userId, email: userEmail },
  update: {},
});

// Now safe to create the order
order = await db.order.create({ data: { userId, configurationId, amount } });
```

**Fix 2:** Remove `enabled: !configId` from the auth-callback query:

```typescript
// app/auth-callback/page.tsx
const { data } = useQuery({
  queryKey: ["auth-callback"],
  queryFn: async () => await getAuthStatus(),
  retry: true,
  retryDelay: 500,
  // Removed: enabled: !configId
});
```

**Fix 3:** Bulk-sync existing Clerk users to the new database using the sync script:

```bash
npx tsx --env-file=.env.local scripts/sync-clerk-users.ts
```

Output:
```
🔄 Fetching all users from Clerk...
📋 Found 4 users in Clerk

  ✅ Created: meharlokesh395@gmail.com (user_2u7mxoLHUwNUMrJQOodhzMlvgSr)
  ✅ Created: gamingwithlions42@gmail.com (user_2trrKIMrfPJdO3e879AnCf0zANM)
  ✅ Created: infernopoolcue@gmail.com (user_2trnfyRgaO7kdzrDU0qGPlo3I7P)
  ✅ Created: imt_2022066@iiitm.ac.in (user_2tqYV1m8KThz0NwKpn4MtX59YsD)

--- Sync Complete ---
  Created: 4
  Errors: 0
```

---

## Bug #3 — UploadThing `serverData` undefined (v7 API change)

### Symptom

After upgrading UploadThing to v7, `data.configId` is `undefined` even when the server successfully returns it.

### Root Cause

UploadThing v7 changed the shape of the client callback argument. Server return values are now nested under `serverData`:

```typescript
// v6 (old)
onClientUploadComplete: ([data]) => {
  const configId = data.configId; // ✅ worked in v6
}

// v7 (new)
onClientUploadComplete: ([data]) => {
  const configId = data?.serverData?.configId; // ✅ correct for v7
}
```

### Fix

Access `data.serverData.configId` instead of `data.configId`.

---

## Bug #4 — Prisma Client Not Found in Production Build

### Symptom

Vercel deployment fails with:
```
PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

### Root Cause

When Next.js builds on Vercel, it bundles the code. Prisma needs to generate the correct native binary for the deployment target (Linux) rather than the development machine (Windows/Mac).

### Fix

The `vercel-build` script in `package.json` runs `prisma generate` before `next build`:

```json
"vercel-build": "prisma generate && next build"
```

This regenerates the Prisma client with the correct binary for the Vercel runtime environment.

---

## Bug #5 — `CLERK_SECRET_KEY not found` in Sync Script

### Symptom

Running the sync script fails immediately:
```
❌ CLERK_SECRET_KEY not found in environment variables
```

### Root Cause

Standalone Node.js scripts don't automatically load `.env.local`. Next.js does this internally via its dev server, but `tsx` (used to run `.ts` scripts) does not.

### Fix

Use `tsx`'s `--env-file` flag:

```bash
# Wrong
npx tsx scripts/sync-clerk-users.ts

# Correct
npx tsx --env-file=.env.local scripts/sync-clerk-users.ts
```

---

## Checklist: After Changing DATABASE_URL

If you ever change your database (e.g. switching providers, rotating credentials):

- [ ] Update `DATABASE_URL` in `.env.local`
- [ ] Update `DATABASE_URL` in Vercel environment variables
- [ ] Run `npx prisma db push` to create all tables
- [ ] Run `npx prisma generate` to regenerate the client
- [ ] Run `npx tsx --env-file=.env.local scripts/sync-clerk-users.ts` to sync existing users
- [ ] Redeploy on Vercel (`git push`)
- [ ] Test an upload → design → checkout flow end to end
