"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const requireJwt = (req, res, next) => {
    const authorization = req.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        res.sendStatus(401);
        return;
    }
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
        res.sendStatus(401);
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.key, {
            issuer: config_1.config.jwt.issuer,
            audience: config_1.config.jwt.audience,
        });
        req.auth =
            typeof payload === "string" ? { sub: payload } : payload;
        next();
    }
    catch {
        res.sendStatus(401);
    }
};
exports.requireJwt = requireJwt;
