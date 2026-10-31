# Spendio

A personal finance tracker for managing accounts, transactions, budgets, recurring bills, and savings goals, all in one place.

Spendio is a TypeScript monorepo with a Next.js web app, an Express API, and a shared package for types and validation schemas.

## Features

- **Multi-account**: track bank accounts, e-wallets, and cash with per-account balances.
- **Transactions**: income and expense entries with categories, notes, and dates.
- **Transfers**: move money between accounts while keeping balances consistent.
- **Categories**: one level of nesting with custom icons and colors.
- **Budgets**: set monthly or custom-period limits per category.
- **Recurring transactions**: schedule recurring income and expenses.
- **Savings goals**: track progress toward a target amount and deadline.
- **Dashboard**: balance, income, expense, and category breakdown charts.
- **Preferences**: default currency and a hide-balance toggle.
- **Authentication**: email/password (with verification and reset) and optional Google sign-in.

## Tech stack

| Layer      | Technology                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Web        | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, TanStack Query |
| API        | Express 5, Better Auth, Zod, Drizzle ORM                                   |
| Database   | PostgreSQL 17                                                              |
| Shared     | TypeScript types and Zod schemas in `@spendio/shared`                      |
| Tooling    | npm workspaces, tsx, Vitest, ESLint, Docker Compose                        |

## Project structure

```
spendio/
├── apps/
│   ├── api/            # Express API, Better Auth, Drizzle schema and migrations
│   └── web/            # Next.js web app
├── packages/
│   └── shared/         # Shared types, constants, and Zod schemas
├── supabase/           # Legacy SQL migrations (reference only)
└── compose.yaml        # Local PostgreSQL service
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Docker (for the local PostgreSQL container)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Generate a secret for `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Set it in `apps/api/.env`. The defaults assume:

- PostgreSQL runs on `localhost:5433`
- The API runs on `http://localhost:4000`
- The web app runs on `http://localhost:3000`

### 3. Start the database

```bash
npm run db:up
```

### 4. Run migrations and seed data

```bash
npm run db:migrate
npm run db:seed
```

The seed creates a local account you can sign in with:

```
Email:    seed@spendio.local
Password: password123
```

### 5. Start the apps

Run the API and web app in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run dev` and `npm run dev:api` both build `@spendio/shared` first, so changes to shared types are picked up automatically.

## Available scripts

Run these from the repository root.

| Script              | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Build shared and start the web app                     |
| `npm run dev:web`   | Same as `npm run dev`                                  |
| `npm run dev:api`   | Build shared and start the API in watch mode           |
| `npm run build`     | Build shared, API, and web                             |
| `npm run start:web` | Start the production web server                        |
| `npm run start:api` | Start the production API server                        |
| `npm run lint`      | Lint the web app                                       |
| `npm run typecheck` | Typecheck all workspaces                               |
| `npm run test:unit` | Run API unit tests with Vitest                         |
| `npm run db:up`     | Start PostgreSQL with Docker Compose                   |
| `npm run db:down`   | Stop the Docker Compose services                       |
| `npm run db:generate` | Generate a new Drizzle migration from schema changes |
| `npm run db:migrate`  | Apply pending Drizzle migrations                     |
| `npm run db:check`    | Check Drizzle migration consistency                  |
| `npm run db:seed`     | Seed the local database                              |

## API overview

The API exposes a health check, Better Auth handlers, and versioned resource routes:

| Endpoint                 | Description                                  |
| ------------------------ | -------------------------------------------- |
| `/health`                | Health check                                 |
| `/api/auth/*`            | Better Auth (sign-up, sign-in, sessions, …)  |
| `/api/v1/me`             | Current user and profile                     |
| `/api/v1/accounts`       | Account CRUD                                 |
| `/api/v1/categories`     | Category CRUD                                |
| `/api/v1/preferences`    | Per-user preference get/set                  |
| `/api/v1/transactions`   | Transaction CRUD                             |
| `/api/v1/transfers`      | Transfers between accounts                   |
| `/api/v1/dashboard`      | Dashboard summary and charts                 |
| `/api/v1/budgets`        | Budget CRUD and spending progress            |
| `/api/v1/recurring`      | Recurring transaction CRUD                   |
| `/api/v1/savings-goals`  | Savings goal CRUD                            |

All `/api/v1/*` routes require an authenticated session. Authentication is handled by [Better Auth](https://www.better-auth.com/).

### Email in development

`EMAIL_TRANSPORT=console` prints verification and password-reset emails to the API terminal. In production, email delivery must be configured; otherwise the API fails closed instead of silently dropping messages.

### Google sign-in (optional)

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `apps/api/.env` to enable Google authentication.

## Database changes

The schema lives in `apps/api/src/db/schema.ts` and is managed with Drizzle Kit.

```bash
# 1. Edit the schema
# 2. Generate a migration
npm run db:generate

# 3. Apply it
npm run db:migrate
```

Money is stored as `numeric(16,2)` and handled as strings in TypeScript. Balance updates are performed in SQL to avoid floating-point arithmetic.

## Testing and quality checks

```bash
npm run test:unit
npm run typecheck
npm run lint
```

## License

Released under the [MIT License](LICENSE).
