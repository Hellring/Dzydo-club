# DzydoClub

A comprehensive TypeScript/Node.js application for managing judo clubs with multitenancy, tournament management, and user invitations.

## Status

✅ **Stage 1: Core System — 100% Complete**
- JWT authentication with access/refresh tokens
- PostgreSQL multitenancy with schema isolation
- RBAC with 6 roles (SUPERADMIN, ADMIN, COACH, JUDGE, ATHLETE, PARENT)
- User invitation system with token-based acceptance
- Complete CRUD for clubs, athletes, groups, tournaments, and matches
- Bracket generation with auto-promotion of winners
- Comprehensive API documentation (Swagger UI)
- Full integration test coverage
- GitHub Actions CI/CD pipeline

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose (for PostgreSQL)
- npm 10+

### Local Setup

1. **Start PostgreSQL:**
```bash
docker run -d --name dzydo-club-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dzydo_club \
  -p 5432:5432 \
  postgres:13
```

2. **Install dependencies:**
```bash
npm install
```

3. **Initialize database:**
```bash
npm run db:init
npm run db:seed
```

4. **Run tests:**
```bash
npm test
```

5. **Start the server:**
```bash
npm start
```
The server listens on **http://localhost:8081**

## Development

Run in development mode with auto-restart:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## API Documentation

Full Swagger/OpenAPI documentation is available at http://localhost:8081/api-docs

### Key Endpoints
- `POST /auth/login` — User login
- `POST /auth/refresh` — Refresh access token
- `POST /clubs` — Create new club
- `GET /clubs/:clubId` — Get club details
- `POST /users/invite` — Invite new user
- `POST /tournaments` — Create tournament
- `GET /tournaments/:tournamentId/matches` — Get tournament matches
- `POST /matches/:matchId/result` — Record match result

See [BACKEND_DOCUMENTATION.md](BACKEND_DOCUMENTATION.md) for complete API reference.

## Testing

The repository includes integration tests covering:
- User authentication and invitations
- Multitenancy data isolation
- Tournament bracket generation
- Match result recording

Run tests:
```bash
npm test
```

On CI, the GitHub Actions workflow automatically starts PostgreSQL and runs the full test suite.

## Frontend

A React + Vite frontend is available in the `frontend/` folder.

Run frontend dev server:

```bash
cd frontend
npm install
npm run dev
```

The dev server proxies backend requests to http://localhost:8081

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dzydo_club
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dzydo_club
PORT=8081
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
NODE_ENV=development
```

See `.env.example` for all available options.

## Project Structure

```
.
├── src/                          # Backend source code
│   ├── routes/                   # Express route handlers
│   ├── services/                 # Business logic (auth, invitations, etc.)
│   ├── middleware/               # Auth middleware, error handling
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server initialization
├── frontend/                     # React + Vite frontend
│   └── src/
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Prisma schema
│   └── migrations/               # SQL migrations
├── tests/                        # Integration tests
├── .github/workflows/            # GitHub Actions CI/CD
└── package.json
```

## Documentation

- [BACKEND_DOCUMENTATION.md](BACKEND_DOCUMENTATION.md) — Complete API reference with examples
- [DEVELOPMENT_STEPS.md](DEVELOPMENT_STEPS.md) — Development roadmap and stage breakdown
- [ISSUES_STAGE1.md](ISSUES_STAGE1.md) — Stage 1 completion checklist

## Technologies

- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL 13+, Prisma ORM
- **Authentication:** JWT with access/refresh tokens
- **Testing:** Jest, Supertest
- **CI/CD:** GitHub Actions with Docker services
- **Frontend:** React, Vite, TypeScript
