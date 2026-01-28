"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLocalAccount = exports.localAccountIssuer = void 0;
exports.localAccountIssuer = "local";
const isLocalAccount = (issuer) => issuer.toLowerCase() === exports.localAccountIssuer;
exports.isLocalAccount = isLocalAccount;
