# NodeAuth

Scaffold for a Node.js auth service mirroring the .NET auth concepts.

## Environment variables

All variables are loaded from a `.env` file in the project root (and from
`.env.development` when `NODE_ENV=development`). Required variables are
validated at startup: the process exits with an error if any of them is
missing or empty.

### Required

| Variable | Purpose |
| --- | --- |
| `POSTGRES_USER` | PostgreSQL user used to connect to the database |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `JWT_KEY` | Secret used to sign JWTs |
| `AUTH_COOKIE_SECRET_BASE64` | Base64 key for cookie protection (must decode to 32 bytes) |
| `ORIGIN_HOST` | Public host of this service (used for OAuth callback URLs and base URL) |
| `POSTGRES_HOST` | PostgreSQL host |
| `POSTGRES_DATABASE` | PostgreSQL database name |

### Optional

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | – | `development` also loads `.env.development` |
| `PORT` | `3001` | HTTP port the server listens on |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USE_SSL` | `true` | Use SSL for the PostgreSQL connection |
| `JWT_ISSUER` | `https://app.example.com` | JWT issuer claim |
| `JWT_AUDIENCE` | `drive-api` | JWT audience claim |
| `JWT_EXPIRES_IN_SECONDS` | `900` | Access token lifetime |
| `RT_EXPIRES_IN_HOURS` | `720` | Refresh token lifetime |
| `RT_SESSION_MAX_AGE_HOURS` | `0` | Session max age |
| `AUTH_COOKIE_NAME` | `auth` | Auth cookie name |
| `AUTH_COOKIE_MAX_AGE_HOURS` | `720` | Auth cookie lifetime |
| `ORIGIN_SCHEME` | `https` | Scheme of the service base URL |
| `WEB_CLIENT_APP_ORIGIN` | _(empty)_ | Origin of the web client app (frontend); used as the base for the post-login `/federatedLogin` redirect and as the single origin allowed to call this service cross-origin with credentials; empty disables CORS headers and falls back to `ORIGIN_SCHEME`://`ORIGIN_HOST` for the redirect |
| `GOOGLE_OAUTH_ENABLED` | `true` | Enable Google OAuth |
| `GOOGLE_OAUTH_CLIENT_ID` | _(empty)_ | Google OAuth client ID (required at startup when Google OAuth is enabled) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | _(empty)_ | Google OAuth client secret (required at startup when Google OAuth is enabled) |
| `GOOGLE_OAUTH_CALLBACK_PATH` | `/api/auth/web-google-callback` | Google OAuth callback path |
| `APPLE_OAUTH_ENABLED` | `true` | Enable Sign in with Apple |
| `APPLE_CLIENT_ID` | _(empty)_ | Apple client ID (required at startup when Apple OAuth is enabled) |
| `APPLE_TEAM_ID` | _(empty)_ | Apple team ID (required at startup when Apple OAuth is enabled) |
| `APPLE_KEY_ID` | _(empty)_ | Apple key ID (required at startup when Apple OAuth is enabled) |
| `APPLE_PRIVATE_KEY` | _(empty)_ | Apple `.p8` key content; literal `\n` sequences are converted to newlines (required at startup when Apple OAuth is enabled) |
| `APPLE_OAUTH_CALLBACK_PATH` | `/api/auth/web-apple-callback` | Apple OAuth callback path |
| `MICROSOFT_OAUTH_ENABLED` | `true` | Enable Microsoft OAuth |
| `MICROSOFT_OAUTH_CLIENT_ID` | _(empty)_ | Microsoft OAuth client ID (required at startup when Microsoft OAuth is enabled) |
| `MICROSOFT_OAUTH_CLIENT_SECRET` | _(empty)_ | Microsoft OAuth client secret (required at startup when Microsoft OAuth is enabled) |
| `MICROSOFT_OAUTH_TENANT_ID` | `common` | Microsoft tenant ID |
| `MICROSOFT_OAUTH_CALLBACK_PATH` | `/api/auth/web-microsoft-callback` | Microsoft OAuth callback path |
| `VERCEL` | _(unset)_ | When set, the server startup block is skipped (Vercel manages the process) |

Enabled OAuth providers must have their credentials present at startup;
set `<PROVIDER>_OAUTH_ENABLED=false` to disable a provider instead of
supplying credentials.
