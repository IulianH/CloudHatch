import express from "express";
import { buildChangePasswordRouter } from "./controllers/changePasswordController";
import { buildProfileRouter } from "./controllers/profileController";
import { PostgresUserRepo } from "./repos/postgres/PostgresUserRepo";
import { queryAsync } from "./repos/postgres/db";
import { ChangePasswordService } from "./services/ChangePasswordService";
import { config } from "./config";

const app = express();

app.use(express.json());
app.set("trust proxy", 1);

// The service owns its response headers so behavior is identical with or
// without a front-end proxy (which is absent on serverless deploys).
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Strict-Transport-Security", "max-age=31536000");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

const webClientAppOrigin = config.origin.webClientAppOrigin;
if (webClientAppOrigin) {
  app.use((req, res, next) => {
    res.setHeader("Vary", "Origin");
    if (req.headers.origin !== webClientAppOrigin) {
      next();
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", webClientAppOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Cache-Control",
      );
      res.setHeader("Access-Control-Max-Age", "86400");
      res.sendStatus(204);
      return;
    }
    next();
  });
}

const userRepo = new PostgresUserRepo();
const changePasswordService = new ChangePasswordService(userRepo);

app.use("/", buildChangePasswordRouter({ changePasswordService }));
app.use("/", buildProfileRouter());

app.get("/health", (_req, res) => {
  res.status(200).type("text/plain").send("OK");
});

app.get("/health/db", async (_req, res) => {
  try {
    await queryAsync("SELECT 1");
    res.status(200).type("text/plain").send("DATABASE OK");
  } catch (error) {
    console.error("Database health check failed", error);
    res.status(500).type("text/plain").send("DATABASE NOT SET");
  }
});

const startServer = (): void => {
  const port = Number(process.env.PORT ?? 3002);
  app.listen(port, () => {
    console.log(`FSoBE listening on port ${port}`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
