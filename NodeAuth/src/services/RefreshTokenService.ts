import { randomBytes } from "crypto";

import { RefreshTokenConfig } from "../config/refreshToken";
import { RefreshTokenRecord } from "../models/RefreshTokenRecord";
import { IRefreshTokenRepository } from "../repos/interfaces/IRefreshTokenRepository";

export class RefreshTokenService {
  constructor(
    private readonly repo: IRefreshTokenRepository,
    private readonly config: RefreshTokenConfig,
  ) {}

  async generateAsync(userId: string): Promise<string> {
    const now = new Date();
    const record = this.buildRecord(userId, now, 1, now);
    await this.repo.createAsync(record);
    return record.token;
  }

  async refreshAsync(token: string): Promise<RefreshTokenRecord | null> {
    const record = await this.repo.getAsync(token);
    if (!record) {
      return null;
    }

    const now = new Date();
    if (now >= record.expiresAt) {
      await this.repo.deleteAsync(token);
      return null;
    }

    if (this.config.sessionMaxAgeHours > 0) {
      const maxAgeMs = this.config.sessionMaxAgeHours * 60 * 60 * 1000;
      if (now.getTime() - record.sessionCreatedAt.getTime() >= maxAgeMs) {
        await this.repo.deleteAsync(token);
        return null;
      }
    }

    const newRecord = this.buildRecord(
      record.userId,
      now,
      record.index + 1,
      record.sessionCreatedAt,
    );

    await Promise.all([
      this.repo.deleteAsync(token),
      this.repo.createAsync(newRecord),
    ]);

    return newRecord;
  }

  async revokeAsync(token: string, revokeAll: boolean): Promise<void> {
    if (revokeAll) {
      const record = await this.repo.getAsync(token);
      if (record) {
        await this.repo.deleteByUserIdAsync(record.userId);
        return;
      }
    }
    await this.repo.deleteAsync(token);
  }

  private buildRecord(
    userId: string,
    now: Date,
    index: number,
    sessionCreatedAt: Date,
  ): RefreshTokenRecord {
    return {
      token: this.generateRefreshToken(),
      userId,
      sessionCreatedAt,
      expiresAt: new Date(
        now.getTime() + this.config.expiresInHours * 60 * 60 * 1000,
      ),
      index,
    };
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString("base64");
  }
}
