import { RefreshTokenRecord } from "../../models/RefreshTokenRecord";
import { IRefreshTokenRepository } from "../interfaces/IRefreshTokenRepository";

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly refreshTokens = new Map<string, RefreshTokenRecord>();

  async getAsync(token: string): Promise<RefreshTokenRecord | null> {
    return this.refreshTokens.get(token) ?? null;
  }

  async createAsync(record: RefreshTokenRecord): Promise<void> {
    this.refreshTokens.set(record.token, record);
  }

  async updateAsync(record: RefreshTokenRecord): Promise<void> {
    this.refreshTokens.set(record.token, record);
  }

  async deleteAsync(token: string): Promise<void> {
    this.refreshTokens.delete(token);
  }

  async deleteByUserIdAsync(userId: string): Promise<void> {
    for (const [token, record] of this.refreshTokens.entries()) {
      if (record.userId === userId) {
        this.refreshTokens.delete(token);
        return;
      }
    }
  }

  migrate(): void {
    // No-op for in-memory storage
  }
}
