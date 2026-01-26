import { User } from "../../models/User";

export interface IUserRepo {
  insertAsync(user: User): Promise<void>;
  findByUserNameAsync(userName: string): Promise<User | null>;
  findByIdAsync(id: string): Promise<User | null>;
  updateAsync(user: User): Promise<void>;
  migrate(): void;
  findByExternalIdAsync(nameIdentifier: string): Promise<User | null>;
  findByEmailAsync(email: string): Promise<User | null>;
  findByConfirmationTokenAsync(token: string): Promise<User | null>;
  findByResetPasswordTokenAsync(token: string): Promise<User | null>;
}
