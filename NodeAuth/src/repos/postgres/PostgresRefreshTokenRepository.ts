import type { RefreshTokenRecord } from "../../models/RefreshTokenRecord";
import type { IRefreshTokenRepository } from "../interfaces/IRefreshTokenRepository";
import { queryAsync } from "./db";
import { migratePostgresSchemaAsync } from "./migrate";

type RefreshTokenRow = {
  token: string;
  user_id: string;
  session_created_at: Date;
  expires_at: Date;
  token_index: number;
};

const mapRefreshTokenRow = (row: RefreshTokenRow): RefreshTokenRecord => ({
  token: row.token,
  userId: row.user_id,
  sessionCreatedAt: row.session_created_at,
  expiresAt: row.expires_at,
  index: row.token_index,
});

export class PostgresRefreshTokenRepository implements IRefreshTokenRepository {
  async getAsync(token: string): Promise<RefreshTokenRecord | null> {
    const result = await queryAsync<RefreshTokenRow>(
      `
        SELECT * FROM refresh_tokens
        WHERE token = $1
        LIMIT 1
      `,
      [token],
    );
    return result.rows[0] ? mapRefreshTokenRow(result.rows[0]) : null;
  }

  async createAsync(record: RefreshTokenRecord): Promise<void> {
    await queryAsync(
      `
        INSERT INTO refresh_tokens (
          token,
          user_id,
          session_created_at,
          expires_at,
          token_index
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        record.token,
        record.userId,
        record.sessionCreatedAt,
        record.expiresAt,
        record.index,
      ],
    );
  }

  async updateAsync(record: RefreshTokenRecord): Promise<void> {
    await queryAsync(
      `
        UPDATE refresh_tokens
        SET
          user_id = $2,
          session_created_at = $3,
          expires_at = $4,
          token_index = $5
        WHERE token = $1
      `,
      [
        record.token,
        record.userId,
        record.sessionCreatedAt,
        record.expiresAt,
        record.index,
      ],
    );
  }

  async deleteAsync(token: string): Promise<void> {
    await queryAsync(
      `
        DELETE FROM refresh_tokens
        WHERE token = $1
      `,
      [token],
    );
  }

  async deleteByUserIdAsync(userId: string): Promise<void> {
    await queryAsync(
      `
        WITH token_to_delete AS (
          SELECT token
          FROM refresh_tokens
          WHERE user_id = $1
          ORDER BY session_created_at ASC
          LIMIT 1
        )
        DELETE FROM refresh_tokens
        WHERE token IN (SELECT token FROM token_to_delete)
      `,
      [userId],
    );
  }

  migrate(): void {
    void migratePostgresSchemaAsync();
  }
}
