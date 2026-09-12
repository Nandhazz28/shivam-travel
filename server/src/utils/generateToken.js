import jwt from "jsonwebtoken";
import crypto from "crypto";

export function generateAccessToken(
  payload,
  expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured in server/.env");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export const generateToken = generateAccessToken;

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function getRefreshTokenExpiry(
  days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30,
) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export const REFRESH_GRACE_MS = 20 * 1000;
