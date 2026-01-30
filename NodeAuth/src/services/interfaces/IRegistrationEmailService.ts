import { User } from "../../models/User";

export interface IRegistrationEmailService {
  sendRegistrationEmailAsync(
    user: User,
    email: string,
    confirmationUrl: string,
  ): Promise<boolean>;
}
