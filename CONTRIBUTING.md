# Contributing to OctoWrap

Thank you for considering contributing! Here's everything you need to know.

---

## Development Setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/octoWrap.git
cd octoWrap

# 2. Install dependencies
npm install

# 3. Copy env template and fill in your keys
cp .env.local.example .env.local

# 4. Set up the database
npx prisma db push
npx prisma generate

# 5. Start the dev server
npm run dev
```

---

## Branching Strategy

```
main              ← production, always deployable
  └── feature/*   ← new features (e.g. feature/add-samsung-models)
  └── fix/*       ← bug fixes   (e.g. fix/stripe-webhook-signature)
  └── docs/*      ← documentation only
```

Never push directly to `main`. Always open a Pull Request.

---

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short summary>

type:
  feat     → new feature
  fix      → bug fix
  docs     → documentation only
  refactor → code change with no feature/fix
  style    → formatting, no logic change
  test     → adding/fixing tests
  chore    → build tools, dependency updates
```

Examples:
```
feat: add Samsung Galaxy S24 model support
fix: ensure user record exists before order creation
docs: add architecture diagrams to README
refactor: unify Prisma client instances in core.ts
```

---

## Pull Request Process

1. Create your branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Verify the build: `npm run build`
4. Commit with a conventional commit message
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request against `main`
7. Fill in the PR description — what changed and why

---

## Code Style

- **TypeScript everywhere** — no `any` types unless absolutely necessary
- **Server Components by default** — only use `"use client"` when you need browser APIs or React hooks
- **Server Actions over API routes** — for internal mutations, use Server Actions in `actions.ts` files
- **Prisma types** — use auto-generated Prisma types, don't define manual interfaces for DB models
- **No inline styles** — use Tailwind utility classes

---

## What We're Looking For

Good first contributions:

- [ ] Add more iPhone models (e.g. iPhone 16)
- [ ] Add Android phone support (Samsung Galaxy, Pixel)
- [ ] Add more case colors
- [ ] Improve mobile responsiveness of the design step
- [ ] Add order history page for users
- [ ] Write unit tests for Server Actions
- [ ] Internationalization (i18n) support

---

## Questions?

Open a [GitHub Issue](https://github.com/LokeshMehar/octoWrap/issues) with the label `question`.
