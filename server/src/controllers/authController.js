import Admin from "../models/Admin.js";
import {
  generateAccessToken,
  generateRefreshTokenValue,
  hashRefreshToken,
  getRefreshTokenExpiry,
  REFRESH_GRACE_MS,
} from "../utils/generateToken.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail, otpEmailTemplate } from "../services/emailService.js";
import {
  generateOtp,
  hashOtp,
  OTP_TTL_MS,
  MAX_OTP_ATTEMPTS,
  RESEND_COOLDOWN_MS,
} from "../services/otpService.js";
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
  clearRefreshCookieOptions,
} from "../utils/refreshCookie.js";

const MAX_LOGIN_ATTEMPTS = 6;
const LOCK_DURATION_MS = 15 * 60 * 1000;

async function issueSession(admin, res) {
  const accessToken = generateAccessToken({
    id: admin._id,
    type: "admin",
    role: admin.role,
    tv: admin.tokenVersion,
  });

  const rawRefreshToken = generateRefreshTokenValue();

  if (admin.refreshTokenHash) {
    admin.previousRefreshTokenHash = admin.refreshTokenHash;
    admin.previousRefreshTokenExpires = new Date(Date.now() + REFRESH_GRACE_MS);
  } else {
    admin.previousRefreshTokenHash = undefined;
    admin.previousRefreshTokenExpires = undefined;
  }

  admin.refreshTokenHash = hashRefreshToken(rawRefreshToken);
  admin.refreshTokenExpires = getRefreshTokenExpiry();
  await admin.save();

  res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, refreshCookieOptions());
  return accessToken;
}

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new ApiError(400, "Email and password are required.");

  const admin = await Admin.findOne({
    email: String(email).toLowerCase(),
  }).select("+password +failedLoginAttempts +lockUntil");

  const genericError = () => new ApiError(401, "Invalid email or password.");

  if (!admin) throw genericError();

  if (admin.isLocked()) {
    throw new ApiError(
      429,
      "This account is temporarily locked due to repeated failed login attempts. Please try again later.",
    );
  }

  const validPassword = await admin.comparePassword(password);
  if (!validPassword) {
    admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
    if (admin.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      admin.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      admin.failedLoginAttempts = 0;
    }
    await admin.save();
    throw genericError();
  }

  if (!admin.isActive)
    throw new ApiError(403, "This admin account has been deactivated.");

  admin.failedLoginAttempts = 0;
  admin.lockUntil = undefined;

  const token = await issueSession(admin, res);

  res.json({
    success: true,
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawToken)
    throw new ApiError(401, "No active session. Please log in again.");

  const tokenHash = hashRefreshToken(rawToken);

  const selectFields =
    "+refreshTokenHash +refreshTokenExpires +previousRefreshTokenHash +previousRefreshTokenExpires";

  let admin = await Admin.findOne({ refreshTokenHash: tokenHash }).select(
    selectFields,
  );

  if (!admin) {
    const graceAdmin = await Admin.findOne({
      previousRefreshTokenHash: tokenHash,
    }).select(selectFields);
    if (
      graceAdmin &&
      graceAdmin.previousRefreshTokenExpires &&
      graceAdmin.previousRefreshTokenExpires.getTime() >= Date.now()
    ) {
      admin = graceAdmin;
    }
  }

  if (
    !admin ||
    !admin.refreshTokenExpires ||
    admin.refreshTokenExpires.getTime() < Date.now()
  ) {
    res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (!admin.isActive) {
    res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
    throw new ApiError(403, "This admin account has been deactivated.");
  }

  const accessToken = await issueSession(admin, res);

  res.json({
    success: true,
    token: accessToken,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

export const getCurrentAdmin = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: req.admin });
});

export const adminLogout = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (rawToken) {
    const tokenHash = hashRefreshToken(rawToken);

    await Admin.updateOne(
      {
        $or: [
          { refreshTokenHash: tokenHash },
          { previousRefreshTokenHash: tokenHash },
        ],
      },
      {
        $unset: {
          refreshTokenHash: "",
          refreshTokenExpires: "",
          previousRefreshTokenHash: "",
          previousRefreshTokenExpires: "",
        },
      },
    );
  }

  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
  res.json({ success: true, message: "Logged out successfully." });
});

export const requestPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required.");

  const admin = await Admin.findOne({
    email: String(email).toLowerCase(),
  }).select(
    "+resetOtpLastSentAt +resetOtpHash +resetOtpExpires +resetOtpAttempts +resetOtpVerified",
  );

  const genericResponse = () =>
    res.json({
      success: true,
      message:
        "If an admin account exists with that email, a verification code has been sent.",
    });

  if (!admin) return genericResponse();

  if (
    admin.resetOtpLastSentAt &&
    Date.now() - admin.resetOtpLastSentAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    const waitSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - admin.resetOtpLastSentAt.getTime())) /
        1000,
    );
    throw new ApiError(
      429,
      `Please wait ${waitSeconds}s before requesting another code.`,
    );
  }

  const otp = generateOtp();
  admin.resetOtpHash = hashOtp(otp);
  admin.resetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  admin.resetOtpAttempts = 0;
  admin.resetOtpVerified = false;
  admin.resetOtpLastSentAt = new Date();
  await admin.save();

  try {
    await sendEmail({
      to: admin.email,
      subject: "Your Shivam Travels admin verification code",
      html: otpEmailTemplate({ name: admin.name, otp }),
    });
  } catch (err) {
    admin.resetOtpHash = undefined;
    admin.resetOtpExpires = undefined;
    admin.resetOtpLastSentAt = undefined;
    await admin.save();
    throw err;
  }

  genericResponse();
});

export const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and code are required.");

  const admin = await Admin.findOne({
    email: String(email).toLowerCase(),
  }).select(
    "+resetOtpHash +resetOtpExpires +resetOtpAttempts +resetOtpVerified",
  );

  if (!admin || !admin.resetOtpHash || !admin.resetOtpExpires) {
    throw new ApiError(
      400,
      "Invalid or expired code. Please request a new one.",
    );
  }

  if (admin.resetOtpExpires.getTime() < Date.now()) {
    throw new ApiError(400, "This code has expired. Please request a new one.");
  }

  if (admin.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    throw new ApiError(
      429,
      "Too many incorrect attempts. Please request a new code.",
    );
  }

  if (hashOtp(String(otp)) !== admin.resetOtpHash) {
    admin.resetOtpAttempts += 1;
    await admin.save();
    throw new ApiError(400, "Incorrect code. Please try again.");
  }

  admin.resetOtpVerified = true;
  await admin.save();

  res.json({
    success: true,
    message: "Code verified. You can now set a new password.",
  });
});

export const resendPasswordResetOtp = asyncHandler(async (req, res) => {
  await requestPasswordResetOtp(req, res);
});

export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword)
    throw new ApiError(400, "Email and new password are required.");
  if (newPassword.length < 8)
    throw new ApiError(400, "Password must be at least 8 characters.");

  const admin = await Admin.findOne({
    email: String(email).toLowerCase(),
  }).select(
    "+resetOtpHash +resetOtpExpires +resetOtpVerified +password +refreshTokenHash +refreshTokenExpires",
  );

  if (
    !admin ||
    !admin.resetOtpVerified ||
    !admin.resetOtpExpires ||
    admin.resetOtpExpires.getTime() < Date.now()
  ) {
    throw new ApiError(
      400,
      "Your verification session has expired. Please start the reset process again.",
    );
  }

  admin.password = newPassword;
  admin.resetOtpHash = undefined;
  admin.resetOtpExpires = undefined;
  admin.resetOtpAttempts = 0;
  admin.resetOtpVerified = false;
  admin.resetOtpLastSentAt = undefined;
  admin.failedLoginAttempts = 0;
  admin.lockUntil = undefined;

  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  admin.refreshTokenHash = undefined;
  admin.refreshTokenExpires = undefined;
  admin.previousRefreshTokenHash = undefined;
  admin.previousRefreshTokenExpires = undefined;
  await admin.save();

  res.json({
    success: true,
    message: "Password has been reset. Please log in with your new password.",
  });
});
