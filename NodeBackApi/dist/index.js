"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const changePasswordController_1 = require("./controllers/changePasswordController");
const profileController_1 = require("./controllers/profileController");
const InMemoryUserRepo_1 = require("./repos/inMemory/InMemoryUserRepo");
const ChangePasswordService_1 = require("./services/ChangePasswordService");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const userRepo = new InMemoryUserRepo_1.InMemoryUserRepo();
userRepo.migrate();
const changePasswordService = new ChangePasswordService_1.ChangePasswordService(userRepo);
app.use("/", (0, changePasswordController_1.buildChangePasswordRouter)({ changePasswordService }));
app.use("/", (0, profileController_1.buildProfileRouter)());
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
const port = Number(process.env.PORT ?? 3002);
app.listen(port, () => {
    console.log(`NodeBackApi listening on port ${port}`);
});
