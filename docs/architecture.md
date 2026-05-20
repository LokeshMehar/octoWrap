# Architecture

## Overview

OctoWrap is a **monolithic Next.js 14 application** deployed on Vercel. It uses the App Router with a mix of Server Components, Client Components, and Server Actions to minimize client-side JavaScript while keeping the interactive parts (the design canvas, upload dropzone) fully client-rendered.

---

## High-Level System Diagram

```
                        ┌─────────────────────────────────┐
                        │         USER BROWSER             │
                        │                                  │
                        │  React Client Components         │
                        │  ├─ Upload Dropzone (Dropzone.js)│
                        │  ├─ Design Canvas (react-rnd)    │
                        │  ├─ Preview + Checkout Button    │
                        │  └─ Thank You Page               │
                        └──────────────┬──────────────────┘
                                       │ HTTPS
                        ┌──────────────▼──────────────────┐
                        │      VERCEL EDGE / NODE.JS       │
                        │                                  │
                        │  Next.js 14 App Router           │
                        │  ├─ Server Components (RSC)      │
                        │  ├─ Server Actions               │
                        │  ├─ API Route Handlers           │
                        │  └─ Clerk Middleware (JWT verify) │
                        └──────────────┬──────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                         │
   ┌──────────▼──────┐    ┌────────────▼────────┐   ┌──────────▼──────┐
   │   PostgreSQL     │    │    UploadThing CDN   │   │  External APIs  │
   │   (Aiven Cloud)  │    │    (File Storage)    │   │                 │
   │                  │    │                      │   │  ┌───────────┐  │
   │  Accessed via    │    │  Stores user images  │   │  │  Stripe   │  │
   │  Prisma ORM      │    │  and cropped cases   │   │  └───────────┘  │
   │                  │    │                      │   │  ┌───────────┐  │
   │  Tables:         │    │  Returns public URLs │   │  │  Clerk    │  │
   │  • Configuration │    │  for display + email │   │  └───────────┘  │
   │  • User          │    │                      │   │  ┌───────────┐  │
   │  • Order         │    └──────────────────────┘   │  │  Resend   │  │
   │  • ShippingAddr  │                               │  └───────────┘  │
   │  • BillingAddr   │                               └─────────────────┘
   └──────────────────┘
```

---

## Component Architecture

### Server vs Client Split

```
app/
├── page.tsx                    → Server Component (static, SEO-friendly)
├── configure/
│   ├── upload/page.tsx         → Client Component ("use client") — needs browser APIs
│   ├── design/
│   │   ├── page.tsx            → Server Component — fetches config from DB
│   │   └── DesignConfigurator  → Client Component — Canvas, drag-and-drop, react-rnd
│   └── preview/
│       ├── page.tsx            → Server Component — fetches config from DB
│       └── DesignPreview.tsx   → Client Component — mutation, Stripe redirect
├── dashboard/page.tsx          → Server Component — admin only, direct DB queries
└── thank-you/page.tsx          → Server Component — reads orderId from searchParams
```

**Why this split?**
- Server Components render on the server → smaller JS bundles, faster FCP
- Pages that need `useState`, `useRef`, browser Canvas API, or event handlers must be Client Components
- The design step is the most complex client component — it uses `react-rnd` for drag/resize and the HTML5 Canvas API to generate the cropped image

---

## Data Flow Architecture

### Configuration Lifecycle

A `Configuration` record is the central entity that tracks a user's case from upload to order:

```
Phase 1 (Upload):
  Configuration { imageUrl, width, height }

Phase 2 (Design):
  Configuration { imageUrl, croppedImageUrl, color, model, material, finish, width, height }

Phase 3 (Order):
  Order { configurationId → Configuration, userId → User, amount, isPaid, status }
```

---

## Auth Architecture

Clerk handles authentication entirely. OctoWrap integrates in three places:

```
1. Middleware (middleware.ts)
   └─ clerkMiddleware() runs on every request
      └─ Verifies session JWT at the edge
      └─ Does NOT enforce protection — all routes are public by default

2. Server-side (currentUser() from @clerk/nextjs/server)
   └─ Used in: dashboard, createCheckoutSession, getAuthStatus
   └─ Returns null if not logged in

3. Client-side (useAuth() from @clerk/nextjs)
   └─ Used in: DesignPreview — checks isSignedIn to show LoginModal
```

**User sync strategy:**
Clerk is the source of truth for auth. Our PostgreSQL `User` table stores a mirror with `id` (the Clerk user ID) and `email`. Users are synced via:
- `POST /api/clerk/webhook` — fires on `user.created` (new signups)
- `getAuthStatus()` server action — upserts user on every auth-callback visit
- `createCheckoutSession()` — upserts user as a safety net before every order

---

## Webhook Architecture

```
Clerk ──────────────────────────────────▶  POST /api/clerk/webhook
  Event: user.created                       └─ db.user.create({ id, email })

Stripe ─────────────────────────────────▶  POST /api/webhooks
  Event: checkout.session.completed         ├─ Verify stripe-signature header
                                            ├─ db.order.update({ isPaid: true })
                                            ├─ db.order.update({ shippingAddress })
                                            └─ resend.emails.send(OrderReceivedEmail)
```

> ⚠️ Stripe webhooks must verify the `stripe-signature` header using `stripe.webhooks.constructEvent()`. Raw body access is required — not JSON-parsed body.

---

## State Management

No global state library (Redux, Zustand) is used. State is managed via:

| Location | Mechanism | What's stored |
|---|---|---|
| URL params | `?id=configId` | Configuration ID passed between steps |
| React `useState` | Local component state | Options selection, upload progress, UI state |
| TanStack Query | Server state cache | Auth status, checkout mutation |
| localStorage | Persist across redirect | `configurationId` during checkout login flow |
| PostgreSQL | Source of truth | All configuration and order data |
