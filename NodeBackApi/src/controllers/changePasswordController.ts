import { Router, type Request, type Response } from "express";

import { requireJwt } from "../middleware/jwtAuth";
import { ChangePasswordService } from "../services/ChangePasswordService";
import { passwordFormatError, passwordPattern } from "../utils/validation";

type ChangePasswordControllerDeps = {
  changePasswordService: ChangePasswordService;
};

type ChangePasswordBody = {
  oldPassword?: string;
  newPassword?: string;
  OldPassword?: string;
  NewPassword?: string;
};

const getField = (body: ChangePasswordBody, ...keys: Array<keyof ChangePasswordBody>): string => {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string") {
      return value;
    }
  }
  return "";
};

export const buildChangePasswordRouter = ({
  changePasswordService,
}: ChangePasswordControllerDeps): Router => {
  const router = Router();

  router.put(
    "/changepassword",
    requireJwt,
    async (req: Request, res: Response): Promise<void> => {
      const body = (req.body ?? {}) as ChangePasswordBody;
      const oldPassword = getField(body, "oldPassword", "OldPassword");
      const newPassword = getField(body, "newPassword", "NewPassword");

      const errors: Record<string, string[]> = {};
      if (!oldPassword) {
        errors.OldPassword = ["Old password is required"];
      }
      if (!newPassword) {
        errors.NewPassword = ["New password is required"];
      } else if (!passwordPattern.test(newPassword)) {
        errors.NewPassword = [passwordFormatError];
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
    },
  );

  return router;
};
