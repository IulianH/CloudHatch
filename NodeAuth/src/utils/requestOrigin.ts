import type { IncomingHttpHeaders } from "http";

import { csrfHeaderName, csrfHeaderValue } from "./constants";

export const toRequestOrigin = (
  header: string | string[] | undefined,
): string | null => {
  if (!header || Array.isArray(header)) {
    return null;
  }
  try {
    // Referer carries a path; Origin does not. Both reduce to the origin.
    // The literal "null" origin (sandboxed frames) is not a valid URL and
    // is rejected here.
    return new URL(header).origin;
  } catch {
    return null;
  }
};

export const buildTrustedOrigins = (
  baseUrl: string,
  webClientAppOrigin: string,
): Set<string> =>
  new Set([baseUrl, webClientAppOrigin].filter((origin) => origin.length > 0));

export const isTrustedPostRequest = (
  method: string,
  path: string,
  headers: IncomingHttpHeaders,
  trustedOrigins: ReadonlySet<string>,
  exemptPaths: ReadonlySet<string>,
): boolean => {
  if (method !== "POST" || exemptPaths.has(path)) {
    return true;
  }
  // Browsers always send Origin on POSTs; Referer is the fallback for
  // clients that omit it. Requests with neither are rejected.
  const requestOrigin =
    toRequestOrigin(headers.origin) ?? toRequestOrigin(headers.referer);
  if (requestOrigin === null || !trustedOrigins.has(requestOrigin)) {
    return false;
  }
  // The custom header cannot be attached by a cross-site page without a
  // CORS preflight, which is only approved for the trusted client origin.
  return headers[csrfHeaderName.toLowerCase()] === csrfHeaderValue;
};
