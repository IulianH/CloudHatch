import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

import { JwtConfig } from "../config/jwt";
import { TokenPair } from "../models/TokenPair";
import { User } from "../models/User";
import { IUserRepo } from "../repos/interfaces/IUserRepo";
import { RefreshTokenService } from "./RefreshTokenService";

const roleClaimType =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const knownIdps = ["apple", "google", "microsoft"];

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
    const key = Buffer.from(this.config.key, "base64");
    const roles = (user.roles ?? "")
      .split(",")
      .map((role) => role.trim())
      .filter((role) => role.length > 0);
    const payload: jwt.JwtPayload = {
      sub: String(user.id),
      jti: randomUUID(),
      idp: this.getIdp(user.issuer),
    };

    if (user.name) {
      payload.name = user.name;
    }

    if (user.email) {
      payload.email = user.email;
    }

    if (roles.length > 0) {
      payload[roleClaimType] = roles;
    }

    return jwt.sign(payload, key, {
      algorithm: "HS256",
      issuer: this.config.issuer,
      audience: this.config.audience,
      expiresIn: this.config.expiresInSeconds,
    });
  }

  private getIdp(issuer: string): string {
    const normalized = issuer.toLowerCase();
    return knownIdps.find((idp) => normalized.includes(idp)) ?? issuer;
  }
}
