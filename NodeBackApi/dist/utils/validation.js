"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordFormatError = exports.passwordPattern = void 0;
exports.passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
exports.passwordFormatError = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
