import { User } from "./User";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
