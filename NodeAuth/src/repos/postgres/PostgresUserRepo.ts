import type { User } from "../../models/User";
import type { IUserRepo } from "../interfaces/IUserRepo";
import { queryAsync } from "./db";

type UserRow = {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  created_at: Date;
  last_login: Date | null;
  is_locked: boolean;
  roles: string | null;
  external_id: string | null;
  issuer: string;
};

const toNullableDate = (value?: Date): Date | null => value ?? null;

const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  username: row.username ?? undefined,
  email: row.email ?? undefined,
  name: row.name ?? undefined,
  createdAt: row.created_at,
  lastLogin: row.last_login ?? undefined,
  isLocked: row.is_locked,
  roles: row.roles ?? undefined,
  externalId: row.external_id ?? undefined,
  issuer: row.issuer,
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
          last_login,
          is_locked,
          roles,
          external_id,
          issuer
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10
        )
      `,
      [
        user.id,
        user.username ?? null,
        user.email ?? null,
        user.name ?? null,
        user.createdAt,
        toNullableDate(user.lastLogin),
        user.isLocked,
        user.roles ?? null,
        user.externalId ?? null,
        user.issuer,
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
          last_login = $6,
          is_locked = $7,
          roles = $8,
          external_id = $9,
          issuer = $10
        WHERE id = $1
      `,
      [
        user.id,
        user.username ?? null,
        user.email ?? null,
        user.name ?? null,
        user.createdAt,
        toNullableDate(user.lastLogin),
        user.isLocked,
        user.roles ?? null,
        user.externalId ?? null,
        user.issuer,
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
}
