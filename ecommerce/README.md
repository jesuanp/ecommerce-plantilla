# Lumen — Ecommerce Template

A production-quality, single-page ecommerce application built with React, Vite, TypeScript, TailwindCSS, and a tiny Node/Express backend that integrates with **Stripe** (with a built-in **demo mode** if you don't want to set up Stripe right away).

## Features

- **Product catalog** with search, sort, and price range filters
- **Categories** page with visual category cards
- **Product detail** with image gallery, quantity selector, related products
- **Shopping cart** with drawer + full page, persistent across reloads (localStorage)
- **Multi-step checkout** (shipping → payment)
- **Stripe Checkout** integration (with safe demo fallback)
- **Order confirmation** page with full order details
- Fully **responsive** (mobile, tablet, desktop)
- Modern, minimal design with smooth interactions

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS
- **Routing**: React Router v6
- **State**: Zustand (with `persist` middleware for the cart)
- **Icons**: Lucide React
- **Backend**: Node + Express (single file, creates Stripe Checkout sessions)
- **Payments**: Stripe Checkout (or simulated demo)

## Quick start

```bash
# 1. Install
npm install

# 2. Run frontend + backend together
npm run dev
```

This starts:
- **Web** at http://localhost:5173
- **API** at http://localhost:4242

## Stripe setup (optional)

The app works out of the box in **demo mode** — checkout is simulated and you go straight to the success page. When you're ready to take real (test) payments:

1. Create a free Stripe account: https://dashboard.stripe.com/register
2. Get your test secret key: https://dashboard.stripe.com/test/apikeys
3. Copy the env file:
   ```bash
   cp .env.example .env
   ```
4. Add your key to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Restart `npm run dev` — the backend will now redirect to real Stripe Checkout.

**Test card**: `4242 4242 4242 4242` · any future expiry · any CVC · any ZIP.

## Project structure

```
src/
├── components/        # Reusable UI (Header, ProductCard, CartDrawer, Footer)
├── data/              # Mock products & categories
├── pages/             # One component per route
├── store/             # Zustand cart store (with localStorage persist)
├── lib/               # Helpers (formatPrice, tax/shipping calc)
└── types/             # Shared TS types

server/
└── index.ts           # Express + Stripe Checkout API
```

## Available scripts

| Script            | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Start web + API together (recommended)      |
| `npm run dev:web` | Just the Vite dev server                    |
| `npm run dev:api` | Just the Express API                        |
| `npm run build`   | Type-check + production build               |
| `npm run preview` | Preview the production build                |

## Customization

- **Add products**: edit `src/data/products.ts`. Each product needs `id`, `name`, `brand`, `description`, `longDescription`, `price`, `images[]`, `category` (slug), `tags[]`, `stock`, `rating`, `reviewCount`.
- **Add categories**: edit `src/data/categories.ts`. The `slug` must match the `category` field on products.
- **Colors / branding**: `tailwind.config.js` → `theme.extend.colors`. The accent is currently a deep purple (`brand`).
- **Shipping / tax rates**: `src/lib/utils.ts` → `calculateShipping` and `calculateTax`.

## Notes

- All product images use [picsum.photos](https://picsum.photos) with deterministic seeds, so each product has the same image across reloads. Swap them for real CDN URLs in production.
- The cart state is stored under `lumen-cart` in `localStorage`. The last completed order is stored under `lumen-last-order` so the success page can render it.
- This is a **template** — for production, add real auth, a database, an admin panel, and server-side order persistence.
