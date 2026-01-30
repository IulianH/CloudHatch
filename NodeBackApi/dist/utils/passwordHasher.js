"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordHasher = void 0;
const crypto_1 = require("crypto");
const saltSize = 16;
const hashSize = 32;
const iterations = 100000;
class PasswordHasher {
    static hash(password) {
        const salt = (0, crypto_1.randomBytes)(saltSize);
        const hash = (0, crypto_1.pbkdf2Sync)(password, salt, iterations, hashSize, "sha256");
        const iterationStr = iterations.toString();
        const saltB64 = salt.toString("base64");
        const hashB64 = hash.toString("base64");
        return `${iterationStr}.${saltB64}.${hashB64}`;
    }
    static verify(storedHash, password) {
        const parts = storedHash.split(".", 3);
        if (parts.length !== 3) {
            throw new Error("Unexpected hash format. Should be '{iterations}.{salt}.{hash}'");
        }
        const parsedIterations = Number.parseInt(parts[0], 10);
        const salt = Buffer.from(parts[1], "base64");
        const targetHash = Buffer.from(parts[2], "base64");
        const testHash = (0, crypto_1.pbkdf2Sync)(password, salt, parsedIterations, targetHash.length, "sha256");
        return (0, crypto_1.timingSafeEqual)(testHash, targetHash);
    }
}
exports.PasswordHasher = PasswordHasher;
