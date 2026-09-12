import { verifyEmailConnection } from "../services/emailService.js";
import { isRedisReady } from "../config/redis.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/admin/diagnostics
 * Admin-only. Reports the health of infrastructure dependencies (SMTP, Redis) without
 * ever exposing credentials — just enough to tell "not configured" apart from "configured
 * but the connection is actually failing" when something like an SMTP ETIMEDOUT shows up
 * in production logs.
 */
export const getDiagnostics = asyncHandler(async (req, res) => {
  const email = await verifyEmailConnection();

  res.json({
    success: true,
    data: {
      email,
      redis: {
        configured: Boolean(process.env.REDIS_URL),
        ready: isRedisReady(),
      },
      timestamp: new Date().toISOString(),
    },
  });
});
