export const localAccountIssuer = "local";

export const isLocalAccount = (issuer: string): boolean =>
  issuer.toLowerCase() === localAccountIssuer;

// Custom header required on state-changing POSTs. Cross-site pages cannot
// attach custom headers without a CORS preflight, which this service only
// approves for the configured web client origin, so requiring it blocks CSRF.
export const csrfHeaderName = "X-Requested-With";
export const csrfHeaderValue = "XMLHttpRequest";
