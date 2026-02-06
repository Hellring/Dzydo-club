# DzydoClub

A minimal TypeScript starter for DzydoClub.

## Quickstart

Install dependencies:

```bash
npm install
```

Run in development (auto-restarts):

```bash
npm run dev
```

Build and run:

```bash
npm run build
npm start
```

The server listens on `PORT` or `3000` by default and serves a simple JSON welcome at `/`.

Tests
-----

The repository includes integration tests that require a PostgreSQL database. Quick local steps:

```bash
# ensure DATABASE_URL in your environment, e.g.:
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dzydo_club
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dzydo_club_test
export JWT_ACCESS_SECRET=local_access
export JWT_REFRESH_SECRET=local_refresh

# Install deps
npm install

# Generate Prisma client and run migrations (creates public tables)
npm run prisma:generate
npm run db:init

# Seed public data (creates superadmin and initial club schema)
npm run db:seed

# Run tests (ensure TEST_DATABASE_URL is set and a Postgres instance is available)
npm test
```

On CI the workflow will start a Postgres service and run the same sequence automatically.

Frontend
--------

A minimal React + Vite frontend skeleton is available in the `frontend/` folder.

Run frontend dev server:

```bash
cd frontend
npm install
npm run dev
```

The dev server proxies `/api` to the backend at `http://localhost:3000` by default.
