# Deployment Guide

## Platforms

OctoWrap is deployed on **Vercel** with a managed **Aiven PostgreSQL** database.

---

## Prerequisites

Before deploying, ensure you have accounts and API keys for:

| Service | Purpose | Free Tier |
|---|---|---|
| [Vercel](https://vercel.com) | Hosting | Yes |
| [Aiven](https://aiven.io) / [Neon](https://neon.tech) / [Supabase](https://supabase.com) | PostgreSQL | Yes |
| [Clerk](https://clerk.com) | Authentication | Yes (10k MAU) |
| [UploadThing](https://uploadthing.com) | File storage | Yes (2GB) |
| [Stripe](https://stripe.com) | Payments | Yes (test mode) |
| [Resend](https://resend.com) | Transactional email | Yes (3k/month) |

---

## Initial Deployment Steps

### 1. Push to GitHub

```bash
git init
git add -A
git commit -m "feat: initial commit"
git remote add origin https://github.com/yourusername/octowrap.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set the **Build Command** to `npm run vercel-build`
4. Set the **Output Directory** to `.next` (default)

### 3. Add Environment Variables

In Vercel → Project → Settings → Environment Variables, add:

```
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
UPLOADTHING_TOKEN
UPLOADTHING_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
RESEND_EMAIL
NEXT_PUBLIC_SERVER_URL    ← set to your Vercel domain e.g. https://octo-wrap.vercel.app
ADMIN_EMAIL
```

### 4. Set up Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks`
3. Select event: `checkout.session.completed`
4. Copy the **Signing Secret** → paste as `STRIPE_WEBHOOK_SECRET` in Vercel

### 5. Set up Clerk Webhook (optional but recommended)

1. Go to [Clerk Dashboard → Webhooks](https://dashboard.clerk.com/)
2. Add endpoint: `https://your-domain.vercel.app/api/clerk/webhook`
3. Select event: `user.created`

> Even without the Clerk webhook, the `user.upsert()` in `createCheckoutSession()` ensures users are created before orders.

### 6. Initialize the Database

After first deploy, push the schema and sync users:

```bash
# Ensure .env.local points to production DATABASE_URL
npx prisma db push
npx tsx --env-file=.env.local scripts/sync-clerk-users.ts
```

### 7. Deploy

```bash
git push origin main
# Vercel auto-deploys on push to main
```

---

## The `vercel-build` Script

```json
// package.json
"vercel-build": "prisma generate && next build"
```

`prisma generate` must run before `next build` in production because:
- Vercel's build environment is Linux (RHEL)
- Local dev machine is Windows/Mac
- Prisma generates different native binaries per platform
- Without regenerating, the wrong binary is bundled → runtime crash

---

## Continuous Deployment

Every `git push` to `main` triggers a Vercel deployment automatically.

For feature branches, Vercel creates **preview deployments** with unique URLs. These share the same database, so be careful with migrations on preview branches.

---

## Switching Databases

If you need to change `DATABASE_URL` (e.g. rotating credentials, moving providers):

```bash
# 1. Update .env.local
# 2. Update Vercel environment variable
# 3. Push schema to new DB
npx prisma db push

# 4. Sync Clerk users to new DB
npx tsx --env-file=.env.local scripts/sync-clerk-users.ts

# 5. Deploy
git push origin main
```

See [troubleshooting.md](./troubleshooting.md) for the bugs caused by skipping these steps.

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# In a separate terminal — forward Stripe webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks
```

Access the app at `http://localhost:3000`.

---

## Production Checklist

Before going live:

- [ ] All env vars set in Vercel
- [ ] `NEXT_PUBLIC_SERVER_URL` points to production domain (not localhost)
- [ ] Stripe webhook endpoint configured for production domain
- [ ] Stripe keys switched from test (`pk_test_`, `sk_test_`) to live (`pk_live_`, `sk_live_`)
- [ ] `RESEND_EMAIL` is a verified sender domain in Resend
- [ ] `ADMIN_EMAIL` is set to the admin's email address
- [ ] `npx prisma db push` run against production DB
- [ ] Clerk webhook configured for production domain
- [ ] Test a full flow: upload → design → checkout → confirmation email
