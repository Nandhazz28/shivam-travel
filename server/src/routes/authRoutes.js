import { Router } from "express";
import {
  adminLogin,
  getCurrentAdmin,
  adminLogout,
  refreshAccessToken,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resendPasswordResetOtp,
  resetPasswordWithOtp,
} from "../controllers/authController.js";
import { requireAdmin } from "../middleware/auth.js";
import { loginLimiter, otpRequestLimiter, otpVerifyLimiter, refreshLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/login", loginLimiter, adminLogin);
router.post("/refresh", refreshLimiter, refreshAccessToken);
router.get("/me", requireAdmin, getCurrentAdmin);

router.post("/logout", adminLogout);

router.post("/forgot-password", otpRequestLimiter, requestPasswordResetOtp);
router.post("/verify-otp", otpVerifyLimiter, verifyPasswordResetOtp);
router.post("/resend-otp", otpRequestLimiter, resendPasswordResetOtp);
router.post("/reset-password", otpVerifyLimiter, resetPasswordWithOtp);

export default router;
