# Tech Stack

A detailed breakdown of every technology used in OctoWrap, why it was chosen, and what alternatives were considered.

---

## Framework — Next.js 14 (App Router)

**Version:** `14.1.0`

Next.js 14 with the App Router was chosen for its unified full-stack model. Instead of maintaining a separate Express/Fastify API server, all server logic lives in the same codebase as the UI.

### Key Features Used

| Feature | Where Used |
|---|---|
| **Server Components** | `dashboard/page.tsx`, `configure/design/page.tsx`, `configure/preview/page.tsx` — fetch DB data server-side with zero client JS |
| **Server Actions** | `saveConfig()`, `createCheckoutSession()`, `getAuthStatus()` — type-safe RPC calls from client components |
| **API Route Handlers** | `/api/uploadthing`, `/api/webhooks`, `/api/clerk/webhook` — for external service callbacks |
| **Middleware** | `middleware.ts` — runs Clerk auth at the edge on every request |
| **Metadata API** | `dashboard/page.tsx` — SEO title tags |

### Why not Pages Router?
The App Router's Server Components allow direct DB access (via Prisma) inside page components without any `getServerSideProps` boilerplate. The Server Actions pattern eliminates the need to write API route handlers for internal mutations.

---

## Language — TypeScript 5

**Version:** `^5.2.2`

TypeScript provides compile-time type checking across the entire stack. The most valuable places:

- **Prisma-generated types** — `Configuration`, `Order`, `User` types are auto-generated from `schema.prisma` and used directly in Server Actions and components
- **UploadThing router types** — `OurFileRouter` type is shared between the server router and client hook via `generateReactHelpers<OurFileRouter>()`
- **Validator types** — `typeof COLORS[number]`, `typeof MODELS.options[number]` give exact literal types for case options
- **Stripe types** — `Stripe.Checkout.Session`, `Stripe.Event` are fully typed

---

## Auth — Clerk

**Version:** `@clerk/nextjs ^6.12.2`

Clerk handles the full authentication lifecycle including sign-up, sign-in, session management, and user management UI.

### Why Clerk over NextAuth?

| Feature | Clerk | NextAuth |
|---|---|---|
| Hosted UI | ✅ Modal/redirect flows built-in | ❌ Must build your own |
| Webhooks | ✅ `user.created`, `user.updated` | ❌ Not built-in |
| Session management | ✅ Fully managed | ⚠️ Need to configure adapter + DB |
| Edge middleware | ✅ `clerkMiddleware()` | ⚠️ Complex configuration |
| Pricing | Free tier generous | Free |

### Integration Points

```
middleware.ts          → clerkMiddleware() — session validation on every request
app/layout.tsx         → ClerkProvider wraps the app
Server Components      → currentUser() from @clerk/nextjs/server
Client Components      → useAuth(), <SignInButton>, <UserButton> from @clerk/nextjs
Webhook route          → WebhookEvent type from @clerk/nextjs/server
```

---

## Database — PostgreSQL via Aiven

**Provider:** Aiven Cloud managed PostgreSQL
**ORM:** Prisma 6

### Why PostgreSQL?

The data model has clear relational structure:
- A `User` has many `Order`s
- An `Order` belongs to one `Configuration`
- An `Order` has one `ShippingAddress` and one `BillingAddress`

This relational model with foreign key constraints is exactly what PostgreSQL excels at. SQLite was rejected because Vercel's serverless functions can't write to the filesystem. MongoDB was considered but there's no document-shaped data here.

### Why Aiven?

- Managed SSL-enabled PostgreSQL
- Free tier available
- Connection URL works identically locally and in production
- Alternative: Neon (serverless Postgres) or Supabase

---

## ORM — Prisma 6

**Version:** `^6.1.0` (client), `^6.1.0` (CLI dev dep)

### Schema-first development
The `prisma/schema.prisma` file is the single source of truth for:
1. Database table structure
2. TypeScript types (auto-generated)
3. Migration history

### Commands used in this project

```bash
npx prisma db push       # Sync schema to DB (no migration file, good for dev/initial setup)
npx prisma generate      # Regenerate TypeScript client after schema changes
npx prisma studio        # GUI to inspect/edit DB data
```

### Singleton pattern for serverless

```typescript
// db/index.ts — prevents hot-reload from creating too many connections
let prisma: PrismaClient;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient();
  }
  prisma = global.cachedPrisma;
}
```

Without this, Next.js hot-reload in development would create a new `PrismaClient` on every file change, exhausting the connection pool.

---

## File Uploads — UploadThing

**Version:** `uploadthing ^7.4.4`, `@uploadthing/react ^7.1.5`

UploadThing provides a typed file upload router with built-in CDN hosting, progress callbacks, and metadata passing.

### Router definition (server-side)

```typescript
// app/api/uploadthing/core.ts
export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .input(z.object({ configId: z.string().optional() }))
    .middleware(async ({ input }) => ({ input }))
    .onUploadComplete(async ({ metadata, file }) => {
      // Server-side: file.url, metadata.input.configId
      // Return value → accessible as data.serverData on client
      return { configId: "..." };
    }),
} satisfies FileRouter;
```

### Client-side usage

```typescript
// Upload page
const { startUpload } = useUploadThing("imageUploader", {
  onClientUploadComplete: ([data]) => {
    const configId = data?.serverData?.configId; // v7 API
  },
  onUploadProgress: (p) => setUploadProgress(p),
});
```

> **v7 Breaking Change:** In UploadThing v7, server return values are accessed via `data.serverData`, not `data` directly.

### Why not direct S3?
- No presigned URL setup
- No CORS configuration
- Built-in CDN
- TypeScript-typed from router to client
- Progress callbacks out of the box

---

## Payments — Stripe

**Version:** `stripe ^17.5.0`

### Checkout flow

OctoWrap uses **Stripe Checkout Sessions** (hosted payment page) rather than Stripe Elements (embedded form). This means:
- Stripe hosts the payment form — zero PCI compliance burden
- 3DS/SCA handled automatically
- Address collection handled by Stripe

### Webhook verification

```typescript
// Must use raw body — JSON parsing breaks the signature
event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
```

### Test mode
All keys in the repo are Stripe test keys (`pk_test_...`, `sk_test_...`). Use Stripe's test card `4242 4242 4242 4242` to test payments.

---

## Email — Resend + React Email

**Versions:** `resend ^4.1.1`, `@react-email/components ^0.0.32`

### Why Resend over SendGrid/Nodemailer?

| Feature | Resend | SendGrid | Nodemailer |
|---|---|---|---|
| React email templates | ✅ Native | ❌ HTML strings | ❌ HTML strings |
| Developer experience | ✅ Excellent | ⚠️ Complex API | ⚠️ Low-level |
| Free tier | 3,000 emails/month | 100/day | N/A (SMTP) |
| Deliverability | ✅ High | ✅ High | ⚠️ Depends on SMTP |

### Email template

`components/emails/OrderReceivedEmail.tsx` is a React component rendered server-side and sent as HTML email. It receives:
- `orderId`
- `orderDate`
- `shippingAddress`

---

## Image Processing — Sharp

**Version:** `sharp ^0.33.5`

Used in `onUploadComplete` to extract image dimensions (width, height) without downloading the file to disk:

```typescript
const res = await fetch(file.url);
const buffer = await res.arrayBuffer();
const imgMetadata = await sharp(buffer).metadata();
const { width, height } = imgMetadata;
```

This runs on the **server** (Node.js) where Sharp works natively. The browser Canvas API can't be used server-side, and Sharp is much more performant than pure-JS alternatives for image metadata extraction.

---

## UI — Tailwind CSS + shadcn/ui + Headless UI

**Versions:**
- `tailwindcss ^3.4.17`
- `tailwindcss-animate ^1.0.7`
- `@headlessui/react ^2.2.0`
- shadcn/ui components (via `components.json`)

### shadcn/ui components used

| Component | Used in |
|---|---|
| `Button` | Throughout |
| `Progress` | Upload progress, dashboard |
| `ScrollArea` | Design configurator sidebar |
| `DropdownMenu` | Model selector |
| `Dialog` | Login modal |
| `Toast` | Error and success notifications |
| `Card` | Dashboard revenue cards |
| `Table` | Dashboard orders table |
| `Label`, `AspectRatio` | Design configurator |

### Headless UI

`RadioGroup` and `Radio` from `@headlessui/react` are used for the color picker and material/finish selectors — they provide accessible keyboard navigation and ARIA attributes out of the box.

---

## Drag & Resize — react-rnd

**Version:** `react-rnd ^10.4.14`

Used in `DesignConfigurator.tsx` to allow users to drag and resize their image on the phone template canvas.

```typescript
<Rnd
  default={{ x: 150, y: 205, height: h/4, width: w/4 }}
  onResizeStop={(_, __, ref, ___, { x, y }) => { /* update state */ }}
  onDragStop={(_, data) => { /* update position */ }}
  lockAspectRatio
  resizeHandleComponent={{ bottomRight: <HandleComponent />, ... }}
>
  <NextImage src={imageUrl} fill alt="your image" />
</Rnd>
```

---

## Data Fetching — TanStack Query

**Version:** `@tanstack/react-query ^5.64.2`

Used for:
1. **`useQuery`** in `auth-callback/page.tsx` — polls `getAuthStatus()` until the user is created in the DB, then redirects
2. **`useMutation`** in `DesignPreview.tsx` — wraps `createCheckoutSession()` with loading and error state

### Why TanStack Query instead of direct `fetch`?

- Automatic retry (`retry: true, retryDelay: 500`) in the auth callback is important — the user needs to be created in the DB before they can proceed, and this may take a moment after redirect
- `useMutation` gives `isPending` for the loading spinner on the checkout button with no boilerplate

---

## Animation — Framer Motion

**Version:** `framer-motion ^11.18.1`

Used in `Reviews.tsx` for the animated scrolling review carousel on the landing page.

---

## Confetti — react-dom-confetti

**Version:** `react-dom-confetti ^0.2.0`

Fires a confetti animation on the Preview page to delight users when they see their case design:

```typescript
useEffect(() => setShowConfetti(true), []);
<Confetti active={showConfetti} config={{ elementCount: 200, spread: 90 }} />
```
