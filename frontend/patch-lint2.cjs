const fs = require("fs");

const fail = (msg) => { console.error(msg); process.exit(1); };

// --- src/app/login/page.tsx ---
const loginPath = "src/app/login/page.tsx";
let login = fs.readFileSync(loginPath, "utf8");
const loginImportAnchor = "import apiClient from '@/lib/api';";
if (login.split(loginImportAnchor).length !== 2) fail("login import anchor");
login = login.replace(loginImportAnchor, "import apiClient, { type ApiError } from '@/lib/api';");

const fullCast = "as Error & { status?: number; errorData?: any }";
const shortCast = "as Error & { errorData?: any }";
const fullCount = login.split(fullCast).length - 1;
const shortCount = login.split(shortCast).length - 1 - fullCount; // fullCast contains shortCast
if (fullCount !== 1 || shortCount !== 1) fail("login casts: full=" + fullCount + " short=" + shortCount);
login = login.split(fullCast).join("as ApiError");
login = login.split(shortCast).join("as ApiError");
fs.writeFileSync(loginPath, login);
console.log("login page patched");

// --- src/app/confirmEmail/page.tsx ---
const confirmPath = "src/app/confirmEmail/page.tsx";
let confirm = fs.readFileSync(confirmPath, "utf8");
const confirmImportAnchor = "import apiClient from '@/lib/api';";
if (confirm.split(confirmImportAnchor).length !== 2) fail("confirmEmail import anchor");
confirm = confirm.replace(confirmImportAnchor, "import apiClient, { type ApiError } from '@/lib/api';");
const linkAnchor = "import Link from 'next/link';";
if (confirm.split(linkAnchor).length !== 2) fail("Link anchor");
confirm = confirm.replace(linkAnchor + "\r\n", "");
confirm = confirm.replace(linkAnchor + "\n", "");
if (confirm.split(fullCast).length !== 2) fail("confirmEmail cast");
confirm = confirm.replace(fullCast, "as ApiError");
fs.writeFileSync(confirmPath, confirm);
console.log("confirmEmail patched");

// --- src/app/resetPassword/page.tsx ---
const resetPath = "src/app/resetPassword/page.tsx";
let reset = fs.readFileSync(resetPath, "utf8");
const resetImportAnchor = "import apiClient from '@/lib/api';";
if (reset.split(resetImportAnchor).length !== 2) fail("resetPassword import anchor");
reset = reset.replace(resetImportAnchor, "import apiClient, { type ApiError } from '@/lib/api';");
if (reset.split(fullCast).length !== 2) fail("resetPassword cast");
reset = reset.replace(fullCast, "as ApiError");
fs.writeFileSync(resetPath, reset);
console.log("resetPassword patched");

// --- src/app/page.tsx: drop unused useRef import ---
const homePath = "src/app/page.tsx";
let home = fs.readFileSync(homePath, "utf8");
const importLine = "import { useEffect, useRef, useState } from 'react';";
if (home.split(importLine).length !== 2) fail("home import anchor");
home = home.replace(importLine, "import { useEffect, useState } from 'react';");
fs.writeFileSync(homePath, home);
console.log("home page patched");
