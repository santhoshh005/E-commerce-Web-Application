# Santhosh Storefront

A full-stack e-commerce store built with Next.js (App Router), Prisma, PostgreSQL and JWT cookie sessions.

**Live Demo:** [https://e-commerce-web-application-sbmi.vercel.app/](https://e-commerce-web-application-sbmi.vercel.app/)

## Features

- Product catalog with search, category filters and sorting
- Cart (saved in the browser) and a multi-step checkout
- Registration, login and role-based admin access (`USER` / `ADMIN`)
- Order history and status tracking for customers
- Admin dashboard: create, edit, feature and delete products; update order status
- Server-side price, shipping and stock checks, with conditional stock decrements that prevent overselling
- Resilience: if the database is paused or unreachable, the API serves an in-memory fallback instead of failing

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, lucide-react |
| Backend | Next.js route handlers, Zod validation |
| Data | PostgreSQL (Supabase in production), Prisma 7 with the `pg` adapter |
| Auth | bcrypt password hashes, HS256 JWT in an `httpOnly` cookie |

## Getting started

1. Install dependencies (this also generates the Prisma client):

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env` and fill in the values (see below).

3. Start a local PostgreSQL if you don't have one:

   ```bash
   docker compose up -d
   ```

4. Create the tables:

   ```bash
   npx prisma db push
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000. Demo products and the admin account are seeded the first time the API is called.

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. Tables live in the `ecommerce` schema. |
| `JWT_SECRET` | yes | Secret for signing session tokens. Use a long random value in production. |
| `ADMIN_EMAIL` | no | Seed admin email (default `admin@santhosh.store`). |
| `ADMIN_PASSWORD` | production | Seed admin password. Locally it falls back to a demo password; in production no admin is seeded unless this is set. |

Never commit `.env` files. Only `.env.example` is tracked.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Schema, pricing and fallback unit checks |
| `npm run test:smoke` | HTTP smoke test against a running server (`BASE_URL`, default `http://localhost:3000`). It registers a user and places an order, so run it only against a local or test environment. |

## Project structure

```
prisma/schema.prisma      Database schema (User, Product, Order, OrderItem)
src/app/api/              Route handlers: auth, products, orders
src/components/           Storefront, cart, checkout, auth, dashboards, UI primitives
src/context/              Client-side store (session, catalog, cart, UI state)
src/hooks/                Shared React hooks
src/lib/                  Auth, Prisma client, seeding, DB fallback, utilities
scripts/                  Test scripts
```

## Deployment notes

- Set `DATABASE_URL`, `JWT_SECRET` and `ADMIN_PASSWORD` in your hosting provider (for example Vercel).
- Checkout simulates the payment step. Orders are marked `PAID` without charging a card, so connect a payment provider before taking real orders.
- Data written while the in-memory fallback is active (sign-ups and orders made during a database outage) is not saved to PostgreSQL and is lost when the server restarts.
