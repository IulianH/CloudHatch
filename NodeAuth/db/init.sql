-- NodeAuth database initialization script for PostgreSQL (Neon-compatible).
-- Equivalent to `npm run migrate` (src/repos/postgres/migrate.ts).
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    email TEXT,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    last_login TIMESTAMPTZ,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    roles TEXT,
    external_id TEXT,
    issuer TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    token_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
    sid TEXT PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_session_expire
    ON session (expire);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username_lower
    ON users ((LOWER(username)))
    WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_lower
    ON users ((LOWER(email)))
    WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_external_id
    ON users (external_id)
    WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id
    ON refresh_tokens (user_id);

CREATE INDEX IF NOT EXISTS ix_refresh_tokens_expires_at
    ON refresh_tokens (expires_at);
