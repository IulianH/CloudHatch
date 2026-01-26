import { test } from "node:test";
import assert from "node:assert/strict";

import { validateOrigin } from "../originValidator";

const buildRequest = (host?: string) => ({
  headers: {
    host,
  },
});

test("validateOrigin rejects empty host", () => {
  const result = validateOrigin(buildRequest(undefined), "localhost");
  assert.equal(result.allowed, false);
  assert.equal(result.error, "Empty origin received");
});

test("validateOrigin rejects non-matching host", () => {
  const result = validateOrigin(buildRequest("example.com"), "localhost");
  assert.equal(result.allowed, false);
  assert.match(result.error, /not in the allowed list/);
});

test("validateOrigin allows matching host", () => {
  const result = validateOrigin(buildRequest("LOCALHOST"), "localhost");
  assert.equal(result.allowed, true);
  assert.equal(result.error, "");
});
