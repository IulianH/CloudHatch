import type { User } from "../../models/User";

export interface IUserRepo {
  insertAsync(user: User): Promise<void>;
  findByIdAsync(id: string): Promise<User | null>;
  updateAsync(user: User): Promise<void>;
  findByExternalIdAsync(nameIdentifier: string): Promise<User | null>;
  findByEmailAsync(email: string): Promise<User | null>;
}
