"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChangePasswordRouter = void 0;
const express_1 = require("express");
const jwtAuth_1 = require("../middleware/jwtAuth");
const validation_1 = require("../utils/validation");
const getField = (body, ...keys) => {
    for (const key of keys) {
        const value = body[key];
        if (typeof value === "string") {
            return value;
        }
    }
    return "";
};
const buildChangePasswordRouter = ({ changePasswordService, }) => {
    const router = (0, express_1.Router)();
    router.put("/changepassword", jwtAuth_1.requireJwt, async (req, res) => {
        const body = (req.body ?? {});
        const oldPassword = getField(body, "oldPassword", "OldPassword");
        const newPassword = getField(body, "newPassword", "NewPassword");
        const errors = {};
        if (!oldPassword) {
            errors.OldPassword = ["Old password is required"];
        }
        if (!newPassword) {
            errors.NewPassword = ["New password is required"];
        }
        else if (!validation_1.passwordPattern.test(newPassword)) {
            errors.NewPassword = [validation_1.passwordFormatError];
        }
        if (Object.keys(errors).length > 0) {
            res.status(400).json(errors);
            return;
        }
        const userId = typeof req.auth?.sub === "string" ? req.auth.sub : "";
        if (!userId) {
            res.sendStatus(401);
            return;
        }
        const result = await changePasswordService.changePasswordAsync({
            userId,
            oldPassword,
            newPassword,
            lockEnabled: true,
        });
        if (!result.success) {
            switch (result.error) {
                case "UserNotFound":
                    res.status(404).json({
                        error: result.error,
                        error_description: result.errorDescription,
                    });
                    return;
                case "InvalidOldPassword":
                    res.status(401).json({
                        error: result.error,
                        error_description: result.errorDescription,
                    });
                    return;
                case "AccountLocked":
                    res.sendStatus(403);
                    return;
                case "InvalidAccountType":
                case "InvalidPasswordFormat":
                    res.status(400).json({
                        error: result.error,
                        error_description: result.errorDescription,
                    });
                    return;
                default:
                    res.status(400).json({
                        error: result.error ?? "ChangePasswordFailed",
                        error_description: result.errorDescription,
                    });
                    return;
            }
        }
        res.status(200).json({ message: "Password changed successfully." });
    });
    return router;
};
exports.buildChangePasswordRouter = buildChangePasswordRouter;
