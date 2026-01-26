import express from "express";

import { buildAuthRouter } from "./controllers/authController";
import { config } from "./config";
import { InMemoryRefreshTokenRepository } from "./repos/inMemory/InMemoryRefreshTokenRepository";
import { InMemoryUserRepo } from "./repos/inMemory/InMemoryUserRepo";
import { JwtTokenService } from "./services/JwtTokenService";
import { RefreshTokenService } from "./services/RefreshTokenService";
import { LoginService } from "./services/LoginService";

const app = express();
app.use(express.json());

const userRepo = new InMemoryUserRepo();
userRepo.migrate();
const refreshTokenRepo = new InMemoryRefreshTokenRepository();
refreshTokenRepo.migrate();

const refreshTokenService = new RefreshTokenService(
  refreshTokenRepo,
  config.refreshToken,
);
const jwtTokenService = new JwtTokenService(
  config.jwt,
  refreshTokenService,
  userRepo,
);
const loginService = new LoginService(userRepo, config.login);

app.use(
  "/api/auth",
  buildAuthRouter({
    jwtTokenService,
    loginService,
    config,
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`NodeAuth listening on port ${port}`);
});
