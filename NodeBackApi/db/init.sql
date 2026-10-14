-- FSoBE database initialization script for PostgreSQL (Neon-compatible).
-- Supplied without migrations for now; apply manually or via your provider's
-- SQL editor. Idempotent: safe to re-run.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    email TEXT,
    name TEXT,
    password TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    locked_until TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    roles TEXT,
    external_id TEXT,
    issuer TEXT NOT NULL,
    email_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    email_confirmation_token TEXT,
    email_confirmation_token_expires_at TIMESTAMPTZ,
    reset_password_token TEXT,
    reset_password_token_expires_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username_lower
    ON users ((LOWER(username)))
    WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_lower
    ON users ((LOWER(email)))
    WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_external_id
    ON users (external_id)
    WHERE external_id IS NOT NULL;
