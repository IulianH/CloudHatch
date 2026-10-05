const fs = require("fs");
const fail = (m) => { console.error(m); process.exit(1); };

const removeStatement = (path, marker) => {
  let lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  const bodyIdx = lines.findIndex((l) => l.includes(marker));
  if (bodyIdx === -1) fail("marker not found: " + marker);
  // Walk back to the opening backtick line, forward to the closing "`," line.
  let start = bodyIdx;
  while (start > 0 && lines[start].trim() !== "`") start--;
  let end = bodyIdx;
  while (end < lines.length - 1 && lines[end].trim() !== "`,") end++;
  if (lines[start].trim() !== "`" || lines[end].trim() !== "`,") {
    fail("statement boundaries not found for: " + marker);
  }
  lines.splice(start, end - start + 1);
  fs.writeFileSync(path, lines.join("\r\n"));
  console.log("removed statement:", marker.trim());
};

const p = "src/repos/postgres/migrate.ts";
removeStatement(p, "CREATE TABLE IF NOT EXISTS sent_emails");
removeStatement(p, "CREATE INDEX IF NOT EXISTS ix_sent_emails_user_type_sent_at");

// --- config/index.ts: drop login/register/registrationEmail ---
let c = fs.readFileSync("src/config/index.ts", "utf8");

const cfgImports = [
  'import { LoginSettings } from "./login";\n',
  'import { RegisterSettings } from "./register";\n',
  'import { RegistrationEmailSettings } from "./email";\n',
];
for (const line of cfgImports) {
  if (c.split(line).length !== 2) fail("config import: " + line.slice(0, 40));
  c = c.replace(line, "");
}

const iface = [
  "  login: LoginSettings;\r\n",
  "  register: RegisterSettings;\r\n",
  "  registrationEmail: RegistrationEmailSettings;\r\n",
];
for (const line of iface) {
  if (c.split(line).length !== 2) fail("config iface: " + JSON.stringify(line));
  c = c.replace(line, "");
}

const loaderLogin =
  '  login: {\n    maxFailedPasswordLoginAttempts: optionalNumber(\n      "LOGIN_MAX_FAILED_ATTEMPTS",\n      6,\n    ),\n    accountLockDurationInMinutes: optionalNumber(\n      "LOGIN_ACCOUNT_LOCK_DURATION_MINUTES",\n      1,\n    ),\n    lockoutStartsAfterAttempts: optionalNumber(\n      "LOGIN_LOCKOUT_STARTS_AFTER_ATTEMPTS",\n      3,\n    ),\n  },\n';
if (c.split(loaderLogin).length !== 2) fail("login loader");
c = c.replace(loaderLogin, "");

const loaderRegister =
  '  register: {\n    emailConfirmationTokenExpiresInHours: optionalNumber(\n      "REGISTER_EMAIL_CONFIRM_TOKEN_EXPIRES_HOURS",\n      72,\n    ),\n    emailConfirmUrl: optionalEnv(\n      "REGISTER_EMAIL_CONFIRM_URL",\n      "https://localhost/confirmEmail",\n    ),\n  },\n';
if (c.split(loaderRegister).length !== 2) fail("register loader");
c = c.replace(loaderRegister, "");

const loaderEmail =
  '  registrationEmail: {\n    maxRegistrationEmailsPerDay: optionalNumber(\n      "REGISTRATION_EMAIL_MAX_PER_DAY",\n      15,\n    ),\n    resendConfirmationEmailCooldownInSeconds: optionalNumber(\n      "REGISTRATION_EMAIL_RESEND_COOLDOWN_SECONDS",\n      15,\n    ),\n    from: optionalEnv("REGISTRATION_EMAIL_FROM", "no-reply@cloudhatch.com"),\n    subject: optionalEnv("REGISTRATION_EMAIL_SUBJECT", "Confirm your email"),\n  },\n';
if (c.split(loaderEmail).length !== 2) fail("registrationEmail loader");
c = c.replace(loaderEmail, "");

fs.writeFileSync("src/config/index.ts", c);
console.log("config/index.ts pruned");
