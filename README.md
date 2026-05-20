<div align="center">

<img src="public/main-1.png" alt="OctoWrap Logo" width="120" />

# 🐙 OctoWrap

### Custom iPhone Case Builder — Upload. Design. Order.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)](https://octo-wrap.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**[Live Demo](https://octo-wrap.vercel.app/) · [Report Bug](https://github.com/LokeshMehar/octoWrap/issues) · [Request Feature](https://github.com/LokeshMehar/octoWrap/issues)**

</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Full User & Data Flow](#-full-user--data-flow)
- [Database Schema](#-database-schema)
- [API Routes](#-api-routes)
- [Project Structure](#-project-structure)
- [Pricing Model](#-pricing-model)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Known Issues & Lessons Learned](#-known-issues--lessons-learned)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About The Project

**OctoWrap** is a full-stack e-commerce application that lets users turn their personal photos into custom-printed iPhone cases. The experience is a guided 3-step funnel:

1. **Upload** — Drop your photo via a drag-and-drop uploader
2. **Design** — Drag, resize & position your image on a live phone preview; pick your color, model, material & finish
3. **Order** — Checkout via Stripe, get a confirmation email, and track your order

The admin gets a protected dashboard with live revenue stats and order management.

> Built as a portfolio / learning project to explore modern full-stack Next.js patterns — file uploads, Stripe webhooks, transactional emails, Clerk auth, and Prisma ORM on a managed Postgres database.

---

## 📸 Screenshots

| Landing Page | Design Step | Preview & Checkout |
|---|---|---|
| Dark hero with social proof | Drag-and-resize configurator | Live case preview + price breakdown |

---

## 🛠 Tech Stack

### Why these choices?

| Layer | Choice | Why not the alternative? |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Server Actions give us RPC-style mutations without a separate API layer. Pages Router would need explicit API routes for everything. |
| **Language** | TypeScript 5 | End-to-end type safety across Prisma models, API payloads, and component props. Catches the class of bugs where a field is renamed in the DB but not in the UI. |
| **Auth** | Clerk | Handles OAuth, magic links, session management, and webhook events out of the box. Rolling our own auth with NextAuth would require more session storage config. |
| **Database** | PostgreSQL (Aiven Cloud) | Relational model fits our data (users → orders → configurations) perfectly. Aiven gives a managed Postgres with SSL and connection pooling. SQLite would be simpler but can't run on serverless Vercel. |
| **ORM** | Prisma 6 | Type-safe DB client generated from the schema. Alternatives like Drizzle are lighter but Prisma's migration tooling and Studio GUI speeds up development. |
| **File Uploads** | UploadThing | Handles chunked uploads, CDN hosting, and progress callbacks. S3 directly requires presigned URL dance + CORS config. |
| **Payments** | Stripe | Industry standard, excellent test mode, and Checkout Sessions handle SCA/3DS automatically. |
| **Email** | Resend + React Email | Write email templates as React components. Nodemailer works but React Email gives live preview and much better DX. |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first with pre-built accessible components. No need to write a design system from scratch. |
| **Image Processing** | Sharp | Server-side image dimension extraction. Runs in Node.js on the server — can't use browser Canvas API in `onUploadComplete`. |
| **Deployment** | Vercel | Zero-config Next.js deployment with Edge middleware and automatic preview deployments per PR. |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                                                                  │
│  ┌──────────┐   ┌─────────────┐   ┌──────────┐   ┌──────────┐  │
│  │  Upload  │──▶│   Design    │──▶│ Preview  │──▶│Thank You │  │
│  │  /upload │   │  /design    │   │ /preview │   │/thank-you│  │
│  └──────────┘   └─────────────┘   └──────────┘   └──────────┘  │
└────────┬─────────────────┬──────────────┬───────────────────────┘
         │                 │              │
         ▼                 ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER (Vercel)                     │
│                                                                  │
│  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Server Actions  │  │   API Routes   │  │    Middleware     │  │
│  │                  │  │                │  │  (Clerk Auth)    │  │
│  │ • saveConfig()   │  │ POST /uploadth │  │                  │  │
│  │ • createCheckout │  │ POST /webhooks │  │  Protects all    │  │
│  │ • getAuthStatus  │  │ POST /clerk/wh │  │  routes via JWT  │  │
│  └────────┬─────────┘  └───────┬────────┘  └──────────────────┘  │
│           │                   │                                  │
└───────────┼───────────────────┼──────────────────────────────────┘
            │                   │
     ┌──────▼──────┐    ┌───────▼──────────────────────────────┐
     │   Prisma    │    │          External Services            │
     │   Client    │    │                                       │
     └──────┬──────┘    │  ┌──────────┐  ┌────────┐  ┌──────┐ │
            │            │  │UploadTh. │  │ Stripe │  │Resend│ │
            ▼            │  │  (CDN)   │  │  API   │  │ API  │ │
     ┌──────────────┐    │  └──────────┘  └────────┘  └──────┘ │
     │  PostgreSQL  │    └───────────────────────────────────────┘
     │  (Aiven)     │
     └──────────────┘
```

---

## 🔄 Full User & Data Flow

### Step 1 — Image Upload

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant UT as UploadThing CDN
    participant S as Server (onUploadComplete)
    participant DB as PostgreSQL

    U->>C: Drops image file
    C->>UT: Upload file (chunks)
    UT-->>C: Progress events (0→100%)
    UT->>S: onUploadComplete callback with file.url
    S->>S: fetch(file.url) + sharp → get dimensions
    S->>DB: configuration.create({ imageUrl, width, height })
    DB-->>S: { id: "cuid..." }
    S-->>C: { configId: "cuid..." }
    C->>C: router.push(/configure/design?id=configId)
```

### Step 2 — Design Configuration

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client (Canvas API)
    participant UT as UploadThing
    participant SA as Server Action
    participant DB as PostgreSQL

    U->>C: Drag/resize image on phone template
    U->>C: Pick color / model / material / finish
    U->>C: Click "Continue"
    C->>C: Canvas.drawImage() → base64 → Blob → File
    C->>UT: startUpload([croppedFile], { configId })
    UT->>SA: onUploadComplete with croppedImageUrl + configId
    SA->>DB: configuration.update({ croppedImageUrl })
    C->>SA: saveConfig({ configId, color, model, material, finish })
    SA->>DB: configuration.update({ color, model, material, finish })
    C->>C: router.push(/configure/preview?id=configId)
```

### Step 3 — Checkout & Payment

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant SA as Server Action
    participant DB as PostgreSQL
    participant ST as Stripe
    participant WH as Stripe Webhook
    participant R as Resend Email

    U->>C: Click "Check out"
    C->>SA: createCheckoutSession({ configId })
    SA->>DB: user.upsert({ id: clerkUserId })
    SA->>DB: order.create({ userId, configId, amount })
    SA->>ST: products.create() + sessions.create()
    ST-->>SA: { url: "stripe-checkout-url" }
    SA-->>C: { url }
    C->>ST: redirect to Stripe Hosted Checkout
    U->>ST: Enter card + shipping details
    ST->>WH: POST /api/webhooks (checkout.session.completed)
    WH->>DB: order.update({ isPaid: true, shippingAddress, billingAddress })
    WH->>R: resend.emails.send(OrderReceivedEmail)
    R-->>U: 📧 Order confirmation email
    ST->>C: redirect to /thank-you?orderId=...
```

### Auth Callback Flow (Login via Checkout Modal)

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant CK as Clerk
    participant CB as /auth-callback
    participant SA as Server Action
    participant DB as PostgreSQL

    U->>C: Click "Check out" (not signed in)
    C->>C: localStorage.set("configurationId", id)
    C->>C: Open LoginModal
    U->>CK: Sign in / Sign up
    CK->>CB: Redirect to /auth-callback
    CB->>SA: getAuthStatus()
    SA->>DB: user.upsert({ id, email })
    CB->>C: router.push(/configure/preview?id=configId)
```

---

## 🗄 Database Schema

```mermaid
erDiagram
    Configuration {
        String  id PK "cuid()"
        Int     width
        Int     height
        String  imageUrl
        String  croppedImageUrl "nullable"
        CaseColor color "nullable"
        PhoneModel model "nullable"
        CaseMaterial material "nullable"
        CaseFinish finish "nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    User {
        String   id PK "Clerk user ID"
        String   email
        DateTime createdAt
        DateTime updatedAt
    }

    Order {
        String      id PK "cuid()"
        String      configurationId FK
        String      userId FK
        Float       amount
        Boolean     isPaid
        OrderStatus status
        String      shippingAddressId FK "nullable"
        String      billingAddressId FK "nullable"
        DateTime    createdAt
        DateTime    updatedAt
    }

    ShippingAddress {
        String id PK
        String name
        String street
        String city
        String postalCode
        String country
        String state "nullable"
        String phoneNumber "nullable"
    }

    BillingAddress {
        String id PK
        String name
        String street
        String city
        String postalCode
        String country
        String state "nullable"
        String phoneNumber "nullable"
    }

    User ||--o{ Order : "places"
    Configuration ||--o{ Order : "referenced in"
    Order }o--|| ShippingAddress : "ships to"
    Order }o--|| BillingAddress : "billed to"
```

### Enums

| Enum | Values |
|---|---|
| `OrderStatus` | `awaiting_shipment`, `fulfilled`, `shipped` |
| `PhoneModel` | `iphonex`, `iphone11`, `iphone12`, `iphone13`, `iphone14`, `iphone15` |
| `CaseMaterial` | `silicone`, `polycarbonate` |
| `CaseFinish` | `smooth`, `textured` |
| `CaseColor` | `black`, `blue`, `rose` |

---

## 🌐 API Routes

| Method | Route | Description | Auth |
|---|---|---|---|
| `GET/POST` | `/api/uploadthing` | UploadThing file router handler | Public |
| `POST` | `/api/webhooks` | Stripe `checkout.session.completed` webhook | Stripe Signature |
| `POST` | `/api/clerk/webhook` | Clerk `user.created` webhook | Public |

### Server Actions (RPC via Next.js)

| Action | File | Description |
|---|---|---|
| `getAuthStatus()` | `app/auth-callback/actions.ts` | Upserts Clerk user into DB after login |
| `saveConfig()` | `app/configure/design/actions.ts` | Saves color/model/material/finish to DB |
| `createCheckoutSession()` | `app/configure/preview/actions.ts` | Creates Stripe session + DB order |

---

## 📁 Project Structure

```
octoWrap/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (Clerk + Providers)
│   ├── globals.css
│   ├── auth-callback/
│   │   ├── page.tsx               # Post-login redirect handler
│   │   └── actions.ts             # getAuthStatus() server action
│   ├── configure/
│   │   ├── upload/page.tsx        # Step 1: Drag-and-drop uploader
│   │   ├── design/
│   │   │   ├── page.tsx           # Step 2: Server component wrapper
│   │   │   ├── DesignConfigurator.tsx  # Interactive canvas + options
│   │   │   └── actions.ts         # saveConfig() server action
│   │   └── preview/
│   │       ├── page.tsx           # Step 3: Server component wrapper
│   │       ├── DesignPreview.tsx  # Case preview + checkout trigger
│   │       └── actions.ts         # createCheckoutSession() server action
│   ├── dashboard/
│   │   ├── page.tsx               # Admin: revenue stats + order table
│   │   └── StatusDropdown.tsx     # Order status changer
│   ├── thank-you/
│   │   └── page.tsx               # Post-payment confirmation
│   └── api/
│       ├── uploadthing/
│       │   ├── core.ts            # UploadThing file router
│       │   └── route.ts           # GET/POST handler
│       ├── webhooks/route.ts      # Stripe webhook
│       └── clerk/webhook/route.ts # Clerk webhook
│
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── emails/OrderReceivedEmail.tsx  # Transactional email template
│   ├── Navbar.tsx
│   ├── Phone.tsx                  # Phone case visual
│   ├── PhonePreview.tsx           # Colored preview variant
│   ├── LoginModal.tsx             # Sign-in prompt modal
│   ├── Reviews.tsx                # Animated review carousel
│   └── Steps.tsx                  # Progress indicator
│
├── db/index.ts                    # Prisma singleton client
├── prisma/schema.prisma           # Database schema
├── lib/
│   ├── stripe.ts                  # Stripe client
│   ├── resend.ts                  # Resend client
│   ├── uploadthing.ts             # UploadThing React helpers
│   └── utils.ts                   # cn(), formatPrice()
├── config/products.ts             # Pricing constants
├── validators/option-validator.ts # COLORS, MODELS, MATERIALS, FINISHES
├── middleware.ts                  # Clerk auth middleware
└── scripts/
    └── sync-clerk-users.ts        # One-off: sync all Clerk users to DB
```

---

## 💰 Pricing Model

| Option | Base | Add-on |
|---|---|---|
| Base Price | $14.00 | — |
| Silicone Material | ✅ Included | +$0 |
| Soft Polycarbonate | — | +$5.00 |
| Smooth Finish | ✅ Included | +$0 |
| Textured Finish | — | +$3.00 |
| **Max Total** | — | **$22.00** |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (local or [Aiven](https://aiven.io/), [Supabase](https://supabase.com/), [Neon](https://neon.tech/))
- Accounts for: [Clerk](https://clerk.com), [UploadThing](https://uploadthing.com), [Stripe](https://stripe.com), [Resend](https://resend.com)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/LokeshMehar/octoWrap.git
cd octoWrap

# 2. Install dependencies
npm install

# 3. Copy and fill in your env vars
cp .env.local.example .env.local
# Edit .env.local with your keys (see Environment Variables section)

# 4. Push the database schema
npx prisma db push

# 5. Generate the Prisma client
npx prisma generate

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're good to go.

### Setting up Stripe Webhooks (Local)

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks
# Copy the webhook signing secret into STRIPE_WEBHOOK_SECRET
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root:

```env
# ─── Database ─────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# ─── Clerk Auth ───────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# ─── UploadThing ──────────────────────────────────────────────────
UPLOADTHING_TOKEN=eyJ...
UPLOADTHING_SECRET_KEY=sk_live_...

# ─── Stripe ───────────────────────────────────────────────────────
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── Resend Email ─────────────────────────────────────────────────
RESEND_API_KEY=re_...
RESEND_EMAIL=orders@yourdomain.com

# ─── App ──────────────────────────────────────────────────────────
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
ADMIN_EMAIL=your-admin@email.com
```

> ⚠️ Never commit `.env.local`. It is already in `.gitignore`.

---

## ☁️ Deployment

### Vercel (Recommended)

```bash
# The vercel-build script runs prisma generate before next build
"vercel-build": "prisma generate && next build"
```

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` into Vercel's project settings
4. Set **Build Command** to `npm run vercel-build`
5. Deploy ✅

### After Switching Databases

If you ever change `DATABASE_URL`:

```bash
# 1. Push schema to new DB
npx prisma db push

# 2. Sync all existing Clerk users into the new DB
npx tsx --env-file=.env.local scripts/sync-clerk-users.ts

# 3. Deploy
git push
```

---

## 🐛 Known Issues & Lessons Learned

These are real bugs we hit during development — documented so you don't repeat them.

### 1. `configId: undefined` after upload

**Symptom:** Image uploads successfully (progress hits 100%) but the user never gets redirected to `/configure/design`. Console shows:
```
Extracted Config ID: undefined
No configId in response. Full response: Object
```

**Root Cause:** The `onUploadComplete` server callback was silently failing because the `Configuration` table didn't exist in the new PostgreSQL database after changing `DATABASE_URL`.

**Fix:**
```bash
npx prisma db push   # Creates all tables in the new DB
npx prisma generate  # Regenerates the Prisma client
```

**Also fixed:** `core.ts` had two separate `PrismaClient` instances — a shared `db` from `@/db` and a standalone `new PrismaClient()`. These were used inconsistently (`create` used standalone, `update` used shared). Unified to use the shared singleton.

---

### 2. Foreign key constraint: `Order_userId_fkey`

**Symptom:** Checkout fails with:
```
Invalid `prisma.order.create()` invocation:
Foreign key constraint violated: `Order_userId_fkey (index)`
```

**Root Cause (Two layers):**

**Layer 1 — Switched to empty DB:** Clerk still had users from the old DB. The new DB had no `User` records. When `order.create()` tries to link `userId → User.id`, it fails because that user row doesn't exist.

**Layer 2 — Auth-callback bug:** In `auth-callback/page.tsx`, the `getAuthStatus` query (which creates the User row) had `enabled: !configId`. When a user signs in via the checkout login modal, `configId` is stored in localStorage *before* they log in — so `configId` is truthy, the query is disabled, and the user is never inserted into the DB.

**Fix 1:** Added `db.user.upsert()` in `createCheckoutSession()` as a safety net before every order creation:
```ts
await db.user.upsert({
  where: { id: userId },
  create: { id: userId, email: userEmail },
  update: {},
});
```

**Fix 2:** Removed `enabled: !configId` from the auth-callback query so it always runs regardless of login flow.

**Fix 3:** Created `scripts/sync-clerk-users.ts` to bulk-sync all existing Clerk users into the new database:
```bash
npx tsx --env-file=.env.local scripts/sync-clerk-users.ts
```

---

### 3. UploadThing `serverData` field in v7

In UploadThing v7, the return value from `onUploadComplete` is accessed via `data.serverData`, not `data` directly. Make sure you're reading `configId` from:
```ts
const configId = data?.serverData?.configId;
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

Made with ❤️ by [Lokesh Mehar](https://github.com/LokeshMehar)

⭐ Star this repo if you found it useful!

</div>
