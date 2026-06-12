# Santhosh Storefront

A small full-stack e-commerce demo built with Next.js, Prisma, PostgreSQL, and JWT-based auth.

## Features

- Product catalog with seeded demo inventory
- Add to cart and checkout flow
- User login, registration, and role-based admin access
- Order tracking for customers and fulfillment updates for admins
- API routes for products, auth, and orders
- PostgreSQL schema ready for Prisma

## Setup

1. Copy `.env.example` to `.env.local` and point `DATABASE_URL` at a PostgreSQL instance.
2. Start PostgreSQL locally if needed:

```bash
docker compose up -d
```

3. Generate the Prisma client and push the schema:

```bash
npx prisma generate
npx prisma db push
```

4. Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Demo admin

- Email: admin@santhosh.store
- Password: Admin123!

The store seeds products and the admin account automatically the first time the APIs run.
