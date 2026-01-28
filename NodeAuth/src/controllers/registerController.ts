import { Router, type Request, type Response } from "express";

import type { AppConfig } from "../config";
import type { ConfirmEmailRequest } from "../models/ConfirmEmailRequest";
import type { RegisterRequest } from "../models/RegisterRequest";
import type { RegistrationEmailRequest } from "../models/RegistrationEmailRequest";
import { RegistrationService } from "../services/RegistrationService";
import { validateOrigin } from "../utils/originValidator";

type RegisterControllerDeps = {
  registrationService: RegistrationService;
  config: AppConfig;
};

export const buildRegisterRouter = ({
  registrationService,
  config,
}: RegisterControllerDeps): Router => {
  const router = Router();

  router.post(
    "/web-register",
    async (req: Request, res: Response): Promise<void> => {
      const originResult = validateOrigin(req, config.origin.host);
      if (!originResult.allowed) {
        console.warn(originResult.error);
        res.sendStatus(403);
        return;
      }

      const body = req.body as RegisterRequest;
      if (!body.email || !body.password) {
        res.sendStatus(400);
        return;
      }

      const result = await registrationService.registerAsync(
        body.email,
        body.password,
      );
      if (!result.success) {
        res.status(400).json({
          error: result.error,
          error_description: result.errorDescription,
        });
        return;
      }

      res.status(200).json({
        message:
          "Registration successful. Please check your email to confirm your account.",
      });
    },
  );

  router.post(
    "/confirm-email",
    async (req: Request, res: Response): Promise<void> => {
      const originResult = validateOrigin(req, config.origin.host);
      if (!originResult.allowed) {
        console.warn(originResult.error);
        res.sendStatus(403);
        return;
      }

      const body = req.body as ConfirmEmailRequest;
      if (!body?.token) {
        res.status(400).json({
          error: "TokenRequired",
          error_description: "Confirmation token is required.",
        });
        return;
      }

      const result = await registrationService.confirmEmailAsync(body.token);
      if (!result.success) {
        res.status(400).json({
          error: result.error,
          error_description: result.errorDescription,
        });
        return;
      }

      res.status(200).json({
        message: "Email confirmed successfully.",
      });
    },
  );

  router.post(
    "/send-registration-email",
    async (req: Request, res: Response): Promise<void> => {
      const originResult = validateOrigin(req, config.origin.host);
      if (!originResult.allowed) {
        console.warn(originResult.error);
        res.sendStatus(403);
        return;
      }

      const body = req.body as RegistrationEmailRequest;
      if (!body?.email) {
        res.status(400).json({
          error: "EmailRequired",
          error_description: "Email is required.",
        });
        return;
      }

      await registrationService.resendRegistrationEmail(body.email);
      res.sendStatus(200);
    },
  );

  return router;
};
