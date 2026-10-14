# FSoBE

Node.js back-end service for FSo, initialized from the CloudHatch
`NodeBackApi` service. Exposes JWT-protected profile and change-password
endpoints backed by PostgreSQL, deployable to Vercel.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/profile` | Returns claims of the authenticated caller (JWT required) |
| `PUT` | `/changepassword` | Changes the password of the authenticated local account (JWT required) |
| `GET` | `/health` | Liveness check |
| `GET` | `/health/db` | Database connectivity check |

## Environment variables

All variables are loaded from a `.env` file in the project root (and from
`.env.development` when `NODE_ENV=development`). Required variables are
validated at startup: the process exits with an error if any of them is
missing or empty. Variable names mirror the NodeAuth service.

### Required

| Variable | Purpose |
| --- | --- |
| `POSTGRES_HOST` | PostgreSQL host |
| `POSTGRES_USER` | PostgreSQL user used to connect to the database |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DATABASE` | PostgreSQL database name |
| `JWT_KEY` | Secret used to verify JWTs (base64) |

### Optional

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | – | `development` also loads `.env.development` |
| `PORT` | `3002` | HTTP port the server listens on (skipped on Vercel) |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USE_SSL` | `true` | Use SSL for the PostgreSQL connection |
| `JWT_ISSUER` | `https://app.example.com` | JWT issuer claim |
| `JWT_AUDIENCE` | `drive-api` | JWT audience claim |
| `WEB_CLIENT_APP_ORIGIN` | _(empty)_ | Origin of the web client app (frontend) allowed to call this service cross-origin with credentials; empty disables CORS headers entirely (same-origin setups) |
| `VERCEL` | _(unset)_ | When set, the server startup block is skipped (Vercel manages the process) |

## Database

PostgreSQL (Neon-compatible) without migrations for now. Initialize the
schema with `db/init.sql` (idempotent, safe to re-run):

```bash
psql "$POSTGRES_CONNECTION_STRING" -f db/init.sql
```

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy to Vercel

The service is Vercel-ready: `api/index.ts` exports the Express app as a
serverless function and `vercel.json` rewrites all traffic to it. Set the
environment variables above in the Vercel project settings.

```bash
vercel deploy
```
