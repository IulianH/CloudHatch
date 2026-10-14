import { PoolClient } from "pg";
import { withPgClientAsync } from "./db";

const MIGRATION_LOCK_KEY = 42881753;

const migrationStatements: readonly string[] = [
  `
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
  `,
  `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_created_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      token_index INTEGER NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS session (
      sid TEXT PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMPTZ NOT NULL
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS ix_session_expire
    ON session (expire);
  `,
  `
    CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username_lower
    ON users ((LOWER(username)))
    WHERE username IS NOT NULL;
  `,
  `
    CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_lower
    ON users ((LOWER(email)))
    WHERE email IS NOT NULL;
  `,
  `
    CREATE UNIQUE INDEX IF NOT EXISTS ux_users_external_id
    ON users (external_id)
    WHERE external_id IS NOT NULL;
  `,
  `
    CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id
    ON refresh_tokens (user_id);
  `,
  `
    CREATE INDEX IF NOT EXISTS ix_refresh_tokens_expires_at
    ON refresh_tokens (expires_at);
  `,
];

const cleanupStatements: readonly string[] = [
  `
    ALTER TABLE users
    DROP COLUMN IF EXISTS password,
    DROP COLUMN IF EXISTS locked_until,
    DROP COLUMN IF EXISTS failed_login_count,
    DROP COLUMN IF EXISTS email_confirmed,
    DROP COLUMN IF EXISTS email_confirmation_token,
    DROP COLUMN IF EXISTS email_confirmation_token_expires_at,
    DROP COLUMN IF EXISTS reset_password_token,
    DROP COLUMN IF EXISTS reset_password_token_expires_at;
  `,
];

const runMigrationsAsync = async (client: PoolClient): Promise<void> => {
  for (const statement of [...cleanupStatements, ...migrationStatements]) {
    await client.query(statement);
  }
};

export const migratePostgresSchemaAsync = async (): Promise<void> => {
  await withPgClientAsync(async (client) => {
    // Keep one connection while migrating to hold an advisory lock safely.
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    try {
      await client.query("BEGIN");
      await runMigrationsAsync(client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]);
    }
  });
};
