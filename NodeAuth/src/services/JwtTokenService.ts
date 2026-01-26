import { JwtConfig } from "../config/jwt";
import { TokenPair } from "../models/TokenPair";
import { User } from "../models/User";
import { IUserRepo } from "../repos/interfaces/IUserRepo";
import { RefreshTokenService } from "./RefreshTokenService";

export class JwtTokenService {
  constructor(
    private readonly config: JwtConfig,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly users: IUserRepo,
  ) {}

  async refreshTokensAsync(refreshToken: string): Promise<TokenPair | null> {
    const record = await this.refreshTokenService.refreshAsync(refreshToken);
    if (!record) {
      return null;
    }

    const user = await this.users.findByIdAsync(record.userId);
    if (!user) {
      return null;
    }

    return this.issueTokens(user);
  }

  async revokeRefreshTokenAsync(
    refreshToken: string,
    revokeAll: boolean,
  ): Promise<void> {
    await this.refreshTokenService.revokeAsync(refreshToken, revokeAll);
  }

  async issueTokenAsync(user: User): Promise<TokenPair> {
    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const accessToken = this.generateJwtToken(user);
    const refreshToken = await this.refreshTokenService.generateAsync(user.id);
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.expiresInSeconds,
      user,
    };
  }

  private generateJwtToken(user: User): string {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      issuer: this.config.issuer,
      audience: this.config.audience,
    };
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }
}
