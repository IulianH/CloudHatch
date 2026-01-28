import type { JwtPayload } from "jsonwebtoken";
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    auth?: JwtPayload & { sub?: string };
  }
}

export {};
