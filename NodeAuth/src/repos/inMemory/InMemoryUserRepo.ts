import { randomUUID } from "crypto";

import { User } from "../../models/User";
import { IUserRepo } from "../interfaces/IUserRepo";

export class InMemoryUserRepo implements IUserRepo {
  private readonly users: User[] = [];

  async insertAsync(user: User): Promise<void> {
    this.users.push(user);
  }

  async findByUserNameAsync(userName: string): Promise<User | null> {
    return (
      this.users.find(
        (user) =>
          user.username?.toLowerCase() === userName.toLowerCase(),
      ) ?? null
    );
  }

  async findByIdAsync(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async updateAsync(_user: User): Promise<void> {
    // In-memory list is by reference, so no update needed.
  }

  migrate(): void {
    const now = new Date();
    this.users.push({
      id: randomUUID(),
      createdAt: now,
      username: "admin@admin.com",
      email: "admin@admin.com",
      name: "John Doe",
      roles: "customer,admin",
      password: "admin1!",
      issuer: "local",
      emailConfirmed: false,
      isLocked: false,
      failedLoginCount: 0,
    });

    this.users.push({
      id: randomUUID(),
      createdAt: now,
      username: "customer@customer.com",
      email: "customer@customer.com",
      name: "Jane Doe",
      roles: "customer",
      password: "customer1!",
      issuer: "local",
      emailConfirmed: false,
      isLocked: false,
      failedLoginCount: 0,
    });
  }

  async findByExternalIdAsync(externalId: string): Promise<User | null> {
    return this.users.find((user) => user.externalId === externalId) ?? null;
  }

  async findByEmailAsync(email: string): Promise<User | null> {
    return (
      this.users.find(
        (user) => user.email?.toLowerCase() === email.toLowerCase(),
      ) ?? null
    );
  }

  async findByConfirmationTokenAsync(token: string): Promise<User | null> {
    return (
      this.users.find((user) => user.emailConfirmationToken === token) ?? null
    );
  }

  async findByResetPasswordTokenAsync(token: string): Promise<User | null> {
    return (
      this.users.find((user) => user.resetPasswordToken === token) ?? null
    );
  }
}
