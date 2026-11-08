import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildTrustedOrigins,
  isTrustedPostRequest,
  toRequestOrigin,
} from "../requestOrigin";

const baseUrl = "https://auth.example.com";
const webClient = "https://app.example.com";
const trusted = buildTrustedOrigins(baseUrl, webClient);
const csrfHeader = { "x-requested-with": "XMLHttpRequest" };

test("toRequestOrigin parses Origin and Referer headers", () => {
  assert.equal(toRequestOrigin("https://app.example.com"), webClient);
  assert.equal(
    toRequestOrigin("https://app.example.com/some/page?x=1"),
    webClient,
  );
});

test("toRequestOrigin rejects missing, array, and null origins", () => {
  assert.equal(toRequestOrigin(undefined), null);
  assert.equal(toRequestOrigin(["https://app.example.com"]), null);
  assert.equal(toRequestOrigin("null"), null);
  assert.equal(toRequestOrigin("not a url"), null);
});

test("buildTrustedOrigins drops the empty web client origin", () => {
  const origins = buildTrustedOrigins(baseUrl, "");
  assert.deepEqual([...origins], [baseUrl]);
});

test("allows non-POST requests regardless of origin", () => {
  assert.equal(
    isTrustedPostRequest("GET", "/web-refresh", {}, trusted, new Set()),
    true,
  );
  assert.equal(
    isTrustedPostRequest(
      "OPTIONS",
      "/web-refresh",
      { origin: "https://evil.example" },
      trusted,
      new Set(),
    ),
    true,
  );
});

test("allows POSTs from the service origin and the web client origin", () => {
  assert.equal(
    isTrustedPostRequest(
      "POST",
      "/web-refresh",
      { origin: baseUrl, ...csrfHeader },
      trusted,
      new Set(),
    ),
    true,
  );
  assert.equal(
    isTrustedPostRequest(
      "POST",
      "/web-refresh",
      { origin: webClient, ...csrfHeader },
      trusted,
      new Set(),
    ),
    true,
  );
});

test("falls back to Referer when Origin is absent", () => {
  assert.equal(
    isTrustedPostRequest(
      "POST",
      "/web-refresh",
      { referer: `${webClient}/callback`, ...csrfHeader },
      trusted,
      new Set(),
    ),
    true,
  );
});

test("rejects POSTs from untrusted origins", () => {
  assert.equal(
    isTrustedPostRequest(
      "POST",
      "/web-refresh",
      { origin: "https://evil.example", ...csrfHeader },
      trusted,
      new Set(),
    ),
    false,
  );
  assert.equal(
    isTrustedPostRequest(
      "POST",
      "/web-logout",
      { origin: "null", ...csrfHeader },
      trusted,
      new Set(),
    ),
    false,
  );
});

test("rejects POSTs with neither Origin nor Referer", () => {
  assert.equal(
    isTrustedPostRequest(
      "POST",
      "/web-refresh",
      { ...csrfHeader },
      trusted,
      new Set(),
    ),
    false,
  );
});

test("rejects trusted-origin POSTs without the custom header", () => {
  assert.equal(
    isTrustedPostRequest(
      "POST",
      "/web-refresh",
      { origin: webClient },
      trusted,
      new Set(),
    ),
    false,
  );
  assert.equal(
    isTrustedPostRequest(
      "POST",
      "/web-refresh",
      { origin: webClient, "x-requested-with": "something-else" },
      trusted,
      new Set(),
    ),
    false,
  );
});

test("exempt paths bypass the check", () => {
  assert.equal(
    isTrustedPostRequest(
      "POST",
      "/web-apple-callback",
      { origin: "https://appleid.apple.com" },
      trusted,
      new Set(["/web-apple-callback"]),
    ),
    true,
  );
});
