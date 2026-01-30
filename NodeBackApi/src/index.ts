import express from "express";

import { buildChangePasswordRouter } from "./controllers/changePasswordController";
import { buildProfileRouter } from "./controllers/profileController";
import { InMemoryUserRepo } from "./repos/inMemory/InMemoryUserRepo";
import { ChangePasswordService } from "./services/ChangePasswordService";

const app = express();
app.use(express.json());

const userRepo = new InMemoryUserRepo();
userRepo.migrate();

const changePasswordService = new ChangePasswordService(userRepo);

app.use("/", buildChangePasswordRouter({ changePasswordService }));
app.use("/", buildProfileRouter());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const port = Number(process.env.PORT ?? 3002);
app.listen(port, () => {
  console.log(`NodeBackApi listening on port ${port}`);
});
