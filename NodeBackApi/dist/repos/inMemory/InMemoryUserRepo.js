"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUserRepo = void 0;
const crypto_1 = require("crypto");
const passwordHasher_1 = require("../../utils/passwordHasher");
class InMemoryUserRepo {
    constructor() {
        this.users = [];
    }
    async insertAsync(user) {
        this.users.push(user);
    }
    async findByUserNameAsync(userName) {
        return (this.users.find((user) => user.username?.toLowerCase() === userName.toLowerCase()) ?? null);
    }
    async findByIdAsync(id) {
        return this.users.find((user) => user.id === id) ?? null;
    }
    async updateAsync(_user) {
        // In-memory list is by reference, so no update needed.
    }
    migrate() {
        const now = new Date();
        this.users.push({
            id: (0, crypto_1.randomUUID)(),
            createdAt: now,
            username: "admin@admin.com",
            email: "admin@admin.com",
            name: "John Doe",
            roles: "customer,admin",
            password: passwordHasher_1.PasswordHasher.hash("admin1!"),
            issuer: "local",
            emailConfirmed: false,
            isLocked: false,
            failedLoginCount: 0,
        });
        this.users.push({
            id: (0, crypto_1.randomUUID)(),
            createdAt: now,
            username: "customer@customer.com",
            email: "customer@customer.com",
            name: "Jane Doe",
            roles: "customer",
            password: passwordHasher_1.PasswordHasher.hash("customer1!"),
            issuer: "local",
            emailConfirmed: false,
            isLocked: false,
            failedLoginCount: 0,
        });
    }
    async findByExternalIdAsync(externalId) {
        return this.users.find((user) => user.externalId === externalId) ?? null;
    }
    async findByEmailAsync(email) {
        return (this.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null);
    }
    async findByConfirmationTokenAsync(token) {
        return (this.users.find((user) => user.emailConfirmationToken === token) ?? null);
    }
    async findByResetPasswordTokenAsync(token) {
        return (this.users.find((user) => user.resetPasswordToken === token) ?? null);
    }
}
exports.InMemoryUserRepo = InMemoryUserRepo;
