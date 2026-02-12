import type { User } from "../../models/User";
import type { IUserRepo } from "../interfaces/IUserRepo";
import { queryAsync } from "./db";
import { migratePostgresSchemaAsync } from "./migrate";

type UserRow = {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  password: string | null;
  created_at: Date;
  locked_until: Date | null;
  last_login: Date | null;
  is_locked: boolean;
  roles: string | null;
  external_id: string | null;
  issuer: string;
  failed_login_count: number;
  email_confirmed: boolean;
  email_confirmation_token: string | null;
  email_confirmation_token_expires_at: Date | null;
  reset_password_token: string | null;
  reset_password_token_expires_at: Date | null;
};

const toNullableDate = (value?: Date): Date | null => value ?? null;

const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  username: row.username ?? undefined,
  email: row.email ?? undefined,
  name: row.name ?? undefined,
  password: row.password ?? undefined,
  createdAt: row.created_at,
  lockedUntil: row.locked_until ?? undefined,
  lastLogin: row.last_login ?? undefined,
  isLocked: row.is_locked,
  roles: row.roles ?? undefined,
  externalId: row.external_id ?? undefined,
  issuer: row.issuer,
  failedLoginCount: row.failed_login_count,
  emailConfirmed: row.email_confirmed,
  emailConfirmationToken: row.email_confirmation_token ?? undefined,
  emailConfirmationTokenExpiresAt:
    row.email_confirmation_token_expires_at ?? undefined,
  resetPasswordToken: row.reset_password_token ?? undefined,
  resetPasswordTokenExpiresAt: row.reset_password_token_expires_at ?? undefined,
});

export class PostgresUserRepo implements IUserRepo {
  async insertAsync(user: User): Promise<void> {
    await queryAsync(
      `
        INSERT INTO users (
          id,
          username,
          email,
          name,
          password,
          created_at,
          locked_until,
          last_login,
          is_locked,
          roles,
          external_id,
          issuer,
          failed_login_count,
          email_confirmed,
          email_confirmation_token,
          email_confirmation_token_expires_at,
          reset_password_token,
          reset_password_token_expires_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
      `,
      [
        user.id,
        user.username ?? null,
        user.email ?? null,
        user.name ?? null,
        user.password ?? null,
        user.createdAt,
        toNullableDate(user.lockedUntil),
        toNullableDate(user.lastLogin),
        user.isLocked,
        user.roles ?? null,
        user.externalId ?? null,
        user.issuer,
        user.failedLoginCount,
        user.emailConfirmed,
        user.emailConfirmationToken ?? null,
        toNullableDate(user.emailConfirmationTokenExpiresAt),
        user.resetPasswordToken ?? null,
        toNullableDate(user.resetPasswordTokenExpiresAt),
      ],
    );
  }

  async findByUserNameAsync(userName: string): Promise<User | null> {
    const result = await queryAsync<UserRow>(
      `
        SELECT * FROM users
        WHERE LOWER(username) = LOWER($1)
        LIMIT 1
      `,
      [userName],
    );
    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  async findByIdAsync(id: string): Promise<User | null> {
    const result = await queryAsync<UserRow>(
      `
        SELECT * FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );
    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  async updateAsync(user: User): Promise<void> {
    await queryAsync(
      `
        UPDATE users
        SET
          username = $2,
          email = $3,
          name = $4,
          password = $5,
          created_at = $6,
          locked_until = $7,
          last_login = $8,
          is_locked = $9,
          roles = $10,
          external_id = $11,
          issuer = $12,
          failed_login_count = $13,
          email_confirmed = $14,
          email_confirmation_token = $15,
          email_confirmation_token_expires_at = $16,
          reset_password_token = $17,
          reset_password_token_expires_at = $18
        WHERE id = $1
      `,
      [
        user.id,
        user.username ?? null,
        user.email ?? null,
        user.name ?? null,
        user.password ?? null,
        user.createdAt,
        toNullableDate(user.lockedUntil),
        toNullableDate(user.lastLogin),
        user.isLocked,
        user.roles ?? null,
        user.externalId ?? null,
        user.issuer,
        user.failedLoginCount,
        user.emailConfirmed,
        user.emailConfirmationToken ?? null,
        toNullableDate(user.emailConfirmationTokenExpiresAt),
        user.resetPasswordToken ?? null,
        toNullableDate(user.resetPasswordTokenExpiresAt),
      ],
    );
  }

  migrate(): void {
    void migratePostgresSchemaAsync();
  }

  async findByExternalIdAsync(nameIdentifier: string): Promise<User | null> {
    const result = await queryAsync<UserRow>(
      `
        SELECT * FROM users
        WHERE external_id = $1
        LIMIT 1
      `,
      [nameIdentifier],
    );
    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  async findByEmailAsync(email: string): Promise<User | null> {
    const result = await queryAsync<UserRow>(
      `
        SELECT * FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );
    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  async findByConfirmationTokenAsync(token: string): Promise<User | null> {
    const result = await queryAsync<UserRow>(
      `
        SELECT * FROM users
        WHERE email_confirmation_token = $1
        LIMIT 1
      `,
      [token],
    );
    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  async findByResetPasswordTokenAsync(token: string): Promise<User | null> {
    const result = await queryAsync<UserRow>(
      `
        SELECT * FROM users
        WHERE reset_password_token = $1
        LIMIT 1
      `,
      [token],
    );
    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }
}
