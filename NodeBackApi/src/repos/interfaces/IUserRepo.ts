import type { User } from "../../models/User";

export interface IUserRepo {
  insertAsync(user: User): Promise<void>;
  updateAsync(user: User): Promise<void>;
  findByIdAsync(id: string): Promise<User | null>;
  findByUserNameAsync(userName: string): Promise<User | null>;
  findByEmailAsync(email: string): Promise<User | null>;
  findByExternalIdAsync(externalId: string): Promise<User | null>;
  findByConfirmationTokenAsync(token: string): Promise<User | null>;
  findByResetPasswordTokenAsync(token: string): Promise<User | null>;
}
