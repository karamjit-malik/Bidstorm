# BidStorm ⚡

Real-time auction platform with intelligent recommendations. React + Vite + Tailwind (client), Node + Express + TypeScript + Socket.io (server), MySQL 8 (InnoDB).

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture, schema, API surface, and build phases.

## Prerequisites

- Node.js 20+
- MySQL 8.0 (InnoDB)

## Setup

```bash
# 1. Install all workspace dependencies (client + server)
npm install

# 2. Configure environment
cp .env.example server/.env      # then fill in DB credentials + JWT secrets

# 3. Create schema + load seed data
#    (uses env vars; MYSQL_BIN can point at the mysql client on Windows)
DB_USER=root MYSQL_PWD='your-password' npm run migrate:seed
```

On Windows the `mysql` client may not be on PATH — point the migration script at it:

```bash
MYSQL_BIN="/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe" \
DB_USER=root MYSQL_PWD='your-password' npm run migrate:seed
```

## Running (development)

```bash
npm run dev          # runs client and server together
# or individually:
npm run dev:server   # http://localhost:5000  (API + health at /api/health)
npm run dev:client   # http://localhost:5173
```

Then open **http://localhost:5173**.

## Seed accounts

All seeded users share the password **`Password123!`**:

| Email | Role |
|-------|------|
| admin@bidstorm.com | admin |
| seller1@bidstorm.com | seller |
| buyer1@bidstorm.com | buyer |

## Project layout

```
client/     React + Vite + Tailwind frontend
server/     Express + TypeScript API (Socket.io added in Phase 4)
database/   17 migrations + seeds + run_migrations.sh
uploads/    auction images (gitignored)
```

## Build phases

Build proceeds in 7 phases (scaffolding → auth → auction CRUD → real-time bidding → scheduled jobs → recommendations → fraud/analytics). Current phase and acceptance criteria live in `CLAUDE.md`.
