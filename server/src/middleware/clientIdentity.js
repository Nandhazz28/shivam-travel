import crypto from "crypto";


export const CLIENT_ID_COOKIE = "svt_cid";
const COOKIE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export function clientIdentityMiddleware(req, res, next) {
  let clientId = req.cookies?.[CLIENT_ID_COOKIE];

  if (!clientId || typeof clientId !== "string" || clientId.length > 100) {
    clientId = crypto.randomUUID();
    const isProd = process.env.NODE_ENV === "production";
    res.cookie(CLIENT_ID_COOKIE, clientId, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: COOKIE_MAX_AGE_MS,
      path: "/",
    });
  }

  req.clientId = clientId;
  next();
}

export function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function anonymousKey(req) {
  return req.clientId ? `cid:${req.clientId}` : `ip:${getClientIp(req)}`;
}
