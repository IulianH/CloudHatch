import { User } from "../../models/User";

export interface IResetPasswordEmailService {
  sendResetPasswordEmailAsync(
    user: User,
    email: string,
    resetPasswordUrl: string,
  ): Promise<boolean>;
}
