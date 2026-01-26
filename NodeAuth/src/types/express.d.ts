import type { FederatedUser } from "../models/FederatedUser";
import "express-session";

declare global {
  namespace Express {
    interface User extends FederatedUser {}
  }
}

declare module "express-session" {
  interface SessionData {
    microsoftReturnUrl?: string;
  }
}

export {};
