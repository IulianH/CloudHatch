import type { User } from "../../models/User";
import type { IUserRepo } from "../interfaces/IUserRepo";
import { queryAsync } from "./db";

type UserRow = {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  created_at: Date;
  locked_until: Date | null;
  last_login: Date | null;
  is_locked: boolean;
  roles: string | null;
  external_id: string | null;
  issuer: string;
  failed_login_count: number;
};

const toNullableDate = (value?: Date): Date | null => value ?? null;

const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  username: row.username ?? undefined,
  email: row.email ?? undefined,
  name: row.name ?? undefined,
  createdAt: row.created_at,
  lockedUntil: row.locked_until ?? undefined,
  lastLogin: row.last_login ?? undefined,
  isLocked: row.is_locked,
  roles: row.roles ?? undefined,
  externalId: row.external_id ?? undefined,
  issuer: row.issuer,
  failedLoginCount: row.failed_login_count,
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
          created_at,
          locked_until,
          last_login,
          is_locked,
          roles,
          external_id,
          issuer,
          failed_login_count
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12
        )
      `,
      [
        user.id,
        user.username ?? null,
        user.email ?? null,
        user.name ?? null,
        user.createdAt,
        toNullableDate(user.lockedUntil),
        toNullableDate(user.lastLogin),
        user.isLocked,
        user.roles ?? null,
        user.externalId ?? null,
        user.issuer,
        user.failedLoginCount,
      ],
    );
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
          created_at = $5,
          locked_until = $6,
          last_login = $7,
          is_locked = $8,
          roles = $9,
          external_id = $10,
          issuer = $11,
          failed_login_count = $12
        WHERE id = $1
      `,
      [
        user.id,
        user.username ?? null,
        user.email ?? null,
        user.name ?? null,
        user.createdAt,
        toNullableDate(user.lockedUntil),
        toNullableDate(user.lastLogin),
        user.isLocked,
        user.roles ?? null,
        user.externalId ?? null,
        user.issuer,
        user.failedLoginCount,
      ],
    );
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
}
