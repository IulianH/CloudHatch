"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.loadConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const environment = process.env.NODE_ENV?.toLowerCase();
if (environment === "development") {
    dotenv_1.default.config({ path: ".env.development" });
}
dotenv_1.default.config();
const optionalEnv = (name, fallback) => {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        return fallback;
    }
    return value.trim();
};
const loadConfig = () => ({
    jwt: {
        key: optionalEnv("JWT_KEY", ""),
        issuer: optionalEnv("JWT_ISSUER", "https://app.example.com"),
        audience: optionalEnv("JWT_AUDIENCE", "drive-api"),
    },
});
exports.loadConfig = loadConfig;
exports.config = (0, exports.loadConfig)();
