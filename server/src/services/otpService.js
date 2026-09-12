import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

export function generateOtp() {

  const num = crypto.randomInt(0, 10 ** OTP_LENGTH);
  return String(num).padStart(OTP_LENGTH, "0");
}

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export { OTP_TTL_MS, MAX_OTP_ATTEMPTS, RESEND_COOLDOWN_MS };
