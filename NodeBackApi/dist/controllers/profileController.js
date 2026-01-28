"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProfileRouter = void 0;
const express_1 = require("express");
const jwtAuth_1 = require("../middleware/jwtAuth");
const getClaim = (claims, key) => {
    const value = claims?.[key];
    return typeof value === "string" ? value : undefined;
};
const buildProfileRouter = () => {
    const router = (0, express_1.Router)();
    router.get("/profile", jwtAuth_1.requireJwt, (req, res) => {
        const claims = req.auth;
        const name = getClaim(claims, "name") ??
            getClaim(claims, "email") ??
            getClaim(claims, "preferred_username") ??
            "External User";
        const idp = getClaim(claims, "idp") ?? "local";
        res.status(200).json({ name, idp });
    });
    return router;
};
exports.buildProfileRouter = buildProfileRouter;
