import { RefreshTokenRecord } from "../../models/RefreshTokenRecord";

export interface IRefreshTokenRepository {
  getAsync(token: string): Promise<RefreshTokenRecord | null>;
  createAsync(record: RefreshTokenRecord): Promise<void>;
  updateAsync(record: RefreshTokenRecord): Promise<void>;
  deleteAsync(token: string): Promise<void>;
  deleteByUserIdAsync(userId: string): Promise<void>;
  migrate(): void;
}
