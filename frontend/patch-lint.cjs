const fs = require("fs");
const nl = "\r\n";

// --- src/lib/api.ts: type the error payloads, export ApiError ---
const apiPath = "src/lib/api.ts";
let api = fs.readFileSync(apiPath, "utf8");

const importAnchor = "import AuthService, { AuthResponse } from './auth';";
if (api.split(importAnchor).length !== 2) {
  console.error("api.ts import anchor failed");
  process.exit(1);
}
api = api.replace(
  importAnchor,
  "export interface ApiErrorBody {" + nl +
  "  error?: string;" + nl +
  "  error_description?: string;" + nl +
  "  message?: string;" + nl +
  "  [key: string]: unknown;" + nl +
  "}" + nl +
  nl +
  "export type ApiError = Error & { status?: number; errorData?: ApiErrorBody };" + nl +
  nl +
  importAnchor,
);

const cast = "as Error & { status?: number; errorData?: any }";
const castCount = api.split(cast).length - 1;
if (castCount !== 6) {
  console.error("expected 6 casts in api.ts, found", castCount);
  process.exit(1);
}
api = api.split(cast).join("as ApiError");
fs.writeFileSync(apiPath, api);
console.log("api.ts patched");

// --- src/app/login/page.tsx: use ApiError ---
const loginPath = "src/app/login/page.tsx";
let login = fs.readFileSync(loginPath, "utf8");

const loginImportAnchor = "import apiClient from '@/lib/api';";
if (login.split(loginImportAnchor).length !== 2) {
  console.error("login import anchor failed");
  process.exit(1);
}
login = login.replace(loginImportAnchor, "import apiClient, { type ApiError } from '@/lib/api';");

const loginCasts = login.split("as Error & { status?: number; errorData?: any }").length - 1;
if (loginCasts !== 2) {
  console.error("expected 2 casts in login page, found", loginCasts);
  process.exit(1);
}
login = login.split("as Error & { status?: number; errorData?: any }").join("as ApiError");
fs.writeFileSync(loginPath, login);
console.log("login page patched");

// --- src/app/confirmEmail/page.tsx: ApiError + drop unused Link ---
const confirmPath = "src/app/confirmEmail/page.tsx";
let confirm = fs.readFileSync(confirmPath, "utf8");
const confirmImportAnchor = "import apiClient from '@/lib/api';";
if (confirm.split(confirmImportAnchor).length !== 2) {
  console.error("confirmEmail import anchor failed");
  process.exit(1);
}
confirm = confirm.replace(confirmImportAnchor, "import apiClient, { type ApiError } from '@/lib/api';");
const linkAnchor = "import Link from 'next/link';";
if (confirm.split(linkAnchor).length !== 2) {
  console.error("Link anchor failed");
  process.exit(1);
}
confirm = confirm.replace(linkAnchor + "\r\n", "");
confirm = confirm.replace(linkAnchor + "\n", "");
const confirmCastCount = confirm.split("as Error & { status?: number; errorData?: any }").length - 1;
if (confirmCastCount !== 1) {
  console.error("expected 1 cast in confirmEmail, found", confirmCastCount);
  process.exit(1);
}
confirm = confirm.split("as Error & { status?: number; errorData?: any }").join("as ApiError");
fs.writeFileSync(confirmPath, confirm);
console.log("confirmEmail patched");

// --- src/app/resetPassword/page.tsx: ApiError ---
const resetPath = "src/app/resetPassword/page.tsx";
let reset = fs.readFileSync(resetPath, "utf8");
const resetImportAnchor = "import apiClient from '@/lib/api';";
if (reset.split(resetImportAnchor).length !== 2) {
  console.error("resetPassword import anchor failed");
  process.exit(1);
}
reset = reset.replace(resetImportAnchor, "import apiClient, { type ApiError } from '@/lib/api';");
const resetCastCount = reset.split("as Error & { status?: number; errorData?: any }").length - 1;
if (resetCastCount !== 1) {
  console.error("expected 1 cast in resetPassword, found", resetCastCount);
  process.exit(1);
}
reset = reset.split("as Error & { status?: number; errorData?: any }").join("as ApiError");
fs.writeFileSync(resetPath, reset);
console.log("resetPassword patched");

// --- src/app/page.tsx: drop unused useRef import ---
const homePath = "src/app/page.tsx";
let home = fs.readFileSync(homePath, "utf8");
const useRefCount = home.split("useRef").length - 1;
if (useRefCount < 1) { console.error("useRef not found in home page"); process.exit(1); }
home = home.replace("import { useEffect, useRef, useState } from 'react';", "import { useEffect, useState } from 'react';");
fs.writeFileSync(homePath, home);
console.log("home page patched");
