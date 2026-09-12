import rateLimit from "express-rate-limit";
import { RedisRateLimitStore } from "./redisRateLimitStore.js";
import { anonymousKey, getClientIp } from "./clientIdentity.js";
import { REFRESH_COOKIE_NAME } from "../utils/refreshCookie.js";
import { hashRefreshToken } from "../utils/generateToken.js";


function rateLimitResponse(message) {
  return function limitHandler(req, res) {
    const headerRetryAfter = Number(res.getHeader("Retry-After"));
    const retryAfter = Number.isFinite(headerRetryAfter) && headerRetryAfter > 0 ? headerRetryAfter : 60;

    res.status(429).json({
      success: false,
      message,
      code: "RATE_LIMITED",
      retryAfter,
      retryAfterSeconds: retryAfter,
    });
  };
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "unknown";
}

function credentialKey(req) {
  const email = normalizeEmail(req.body?.email);
  return `${email}|${getClientIp(req)}`;
}

function refreshKey(req) {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (rawToken) return `token:${hashRefreshToken(rawToken)}`;
  return `ip:${getClientIp(req)}`;
}

function adminActionKey(action) {
  return function keyGenerator(req) {
    const adminId = req.admin?._id || req.admin?.id;
    if (adminId) return `admin:${adminId}:${action}`;
    return `ip:${getClientIp(req)}:${action}`;
  };
}

function buildLimiter({ prefix, windowMs, max, failMode, message, keyGenerator }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisRateLimitStore({ prefix, failMode }),
    keyGenerator,
    handler: rateLimitResponse(message),
  });
}

const TOO_MANY_ATTEMPTS = "Too many attempts. Please wait a few minutes before trying again.";
const TOO_MANY_SUBMISSIONS = "Too many submissions. Please wait a few minutes before trying again.";
const TOO_MANY_REQUESTS = "Too many requests. Please try again later.";


export const loginLimiter = buildLimiter({
  prefix: "login",
  windowMs: 15 * 60 * 1000,
  max: 8,
  failMode: "closed",
  message: TOO_MANY_ATTEMPTS,
  keyGenerator: credentialKey,
});

export const otpRequestLimiter = buildLimiter({
  prefix: "otp-request",
  windowMs: 60 * 60 * 1000,
  max: 5,
  failMode: "closed",
  message: TOO_MANY_ATTEMPTS,
  keyGenerator: credentialKey,
});

export const otpVerifyLimiter = buildLimiter({
  prefix: "otp-verify",
  windowMs: 15 * 60 * 1000,
  max: 10,
  failMode: "closed",
  message: TOO_MANY_ATTEMPTS,
  keyGenerator: credentialKey,
});

export const refreshLimiter = buildLimiter({
  prefix: "refresh",
  windowMs: 15 * 60 * 1000,
  max: 60,
  failMode: "closed",
  message: TOO_MANY_ATTEMPTS,
  keyGenerator: refreshKey,
});


export const uploadLimiter = buildLimiter({
  prefix: "upload",
  windowMs: 15 * 60 * 1000,
  max: 40,
  failMode: "open",
  message: TOO_MANY_ATTEMPTS,
  keyGenerator: adminActionKey("upload"),
});


export const publicFormLimiter = buildLimiter({
  prefix: "public-form",
  windowMs: 15 * 60 * 1000,
  max: 15,
  failMode: "open",
  message: TOO_MANY_SUBMISSIONS,
  keyGenerator: anonymousKey,
});

export const globalSafetyLimiter = buildLimiter({
  prefix: "global-safety",
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
  failMode: "open",
  message: TOO_MANY_REQUESTS,
  keyGenerator: (req) => `ip:${getClientIp(req)}`,
});
