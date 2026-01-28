import { Router, type Request, type Response } from "express";

import type { AppConfig } from "../config";
import type { ResetPasswordRequest } from "../models/ResetPasswordRequest";
import type { SendResetPasswordEmailRequest } from "../models/SendResetPasswordEmailRequest";
import { ResetPasswordService } from "../services/ResetPasswordService";
import { validateOrigin } from "../utils/originValidator";
import { emailPattern } from "../utils/validation";

type ResetPasswordControllerDeps = {
  resetPasswordService: ResetPasswordService;
  config: AppConfig;
};

export const buildResetPasswordRouter = ({
  resetPasswordService,
  config,
}: ResetPasswordControllerDeps): Router => {
  const router = Router();

  router.post(
    "/send-reset-password-email",
    async (req: Request, res: Response): Promise<void> => {
      const originResult = validateOrigin(req, config.origin.host);
      if (!originResult.allowed) {
        console.warn(originResult.error);
        res.sendStatus(403);
        return;
      }

      const body = req.body as SendResetPasswordEmailRequest;
      if (!body?.email) {
        res.status(400).json({
          error: "EmailRequired",
          error_description: "Email is required.",
        });
        return;
      }
      if (!emailPattern.test(body.email)) {
        res.status(400).json({
          error: "EmailFormatError",
          error_description: "Invalid email format.",
        });
        return;
      }

      await resetPasswordService.sendResetPasswordEmail(body.email);
      res.sendStatus(200);
    },
  );

  router.post(
    "/reset-password",
    async (req: Request, res: Response): Promise<void> => {
      const originResult = validateOrigin(req, config.origin.host);
      if (!originResult.allowed) {
        console.warn(originResult.error);
        res.sendStatus(403);
        return;
      }

      const body = req.body as ResetPasswordRequest;
      if (!body?.token) {
        res.status(400).json({
          error: "TokenRequired",
          error_description: "Token is required.",
        });
        return;
      }

      if (!body?.newPassword) {
        res.status(400).json({
          error: "PasswordRequired",
          error_description: "Password is required.",
        });
        return;
      }

      const result = await resetPasswordService.resetPasswordAsync(
        body.token,
        body.newPassword,
      );
      if (!result.success) {
        res.status(400).json({
          error: result.error,
          error_description: result.errorDescription,
        });
        return;
      }

      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({
        message: "Password reset successfully.",
      });
    },
  );

  return router;
};
