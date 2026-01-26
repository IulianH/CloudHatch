import type { Request } from "express";

export type OriginValidationResult = {
  allowed: boolean;
  error: string;
  origin: string | null;
};

export const getRequestHost = (
  req: Pick<Request, "headers">,
): string | null => {
  const host = req.headers.host;
  if (!host) {
    return null;
  }
  if (Array.isArray(host)) {
    return host[0]?.toLowerCase().trim() || null;
  }
  return host.toLowerCase().trim();
};

export const validateOrigin = (
  req: Pick<Request, "headers">,
  allowedHost: string,
): OriginValidationResult => {
  const origin = getRequestHost(req);
  if (!origin) {
    return {
      allowed: false,
      error: "Empty origin received",
      origin: null,
    };
  }

  const allowed = origin === allowedHost.toLowerCase().trim();
  if (!allowed) {
    return {
      allowed: false,
      error: `Origin ${origin} is not in the allowed list`,
      origin,
    };
  }

  return {
    allowed: true,
    error: "",
    origin,
  };
};
