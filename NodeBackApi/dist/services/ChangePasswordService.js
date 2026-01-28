"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordService = void 0;
const constants_1 = require("../utils/constants");
const passwordHasher_1 = require("../utils/passwordHasher");
class ChangePasswordService {
    constructor(repo) {
        this.repo = repo;
    }
    async changePasswordAsync(request) {
        const user = await this.repo.findByIdAsync(request.userId);
        if (!user) {
            return {
                success: false,
                error: "UserNotFound",
                errorDescription: "User was not found.",
            };
        }
        if (request.lockEnabled) {
            if (user.isLocked ||
                (user.lockedUntil && Date.now() <= user.lockedUntil.getTime())) {
                return {
                    success: false,
                    error: "AccountLocked",
                    errorDescription: "Account is locked.",
                };
            }
        }
        if (!(0, constants_1.isLocalAccount)(user.issuer)) {
            return {
                success: false,
                error: "InvalidAccountType",
                errorDescription: "Cannot change password for federated accounts.",
            };
        }
        if (!user.password || !passwordHasher_1.PasswordHasher.verify(user.password, request.oldPassword)) {
            return {
                success: false,
                error: "InvalidOldPassword",
                errorDescription: "Old password is incorrect.",
            };
        }
        user.password = passwordHasher_1.PasswordHasher.hash(request.newPassword);
        await this.repo.updateAsync(user);
        return { success: true };
    }
}
exports.ChangePasswordService = ChangePasswordService;
