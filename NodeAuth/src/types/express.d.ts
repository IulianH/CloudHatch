import type { FederatedUser } from "../models/FederatedUser";

declare global {
  namespace Express {
    interface User extends FederatedUser {}
  }
}

export {};
