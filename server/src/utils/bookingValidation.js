import { ApiError } from "./ApiError.js";

export const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MOBILE_RE = /^(\+?91[\-\s]?)?[6-9]\d{9}$/;
const GENERIC_PHONE_RE = /^[\d+\-\s()]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidTime(value) {
  return typeof value === "string" && TIME_RE.test(value);
}

export function assertValidTimeFields(body, fields = ["pickupTime", "returnTime"]) {
  fields.forEach((field) => {
    const value = body[field];
    if (value !== undefined && value !== null && value !== "" && !isValidTime(value)) {
      throw new ApiError(400, `${field} must be a valid time in 24-hour HH:MM format.`);
    }
  });
}

export function assertValidMobile(mobile) {
  if (!mobile || typeof mobile !== "string") {
    throw new ApiError(400, "A valid mobile number is required.");
  }
  const trimmed = mobile.trim();
  if (!MOBILE_RE.test(trimmed) && !GENERIC_PHONE_RE.test(trimmed)) {
    throw new ApiError(400, "Please enter a valid mobile number.");
  }
}

export function assertValidEmailIfProvided(email) {
  if (email === undefined || email === null || email === "") return;
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    throw new ApiError(400, "Please enter a valid email address.");
  }
}

export function parseCalendarDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (!match) {
    const fallback = new Date(value);
    if (Number.isNaN(fallback.getTime())) return null;
    return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate()));
  }
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return Number.isNaN(date.getTime()) ? null : date;
}

function todayUtcMidnight() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function assertValidBookingDates({
  pickupDate,
  pickupTime,
  bookingType,
  returnDate,
  returnTime,
  allowPastForAdminEdit = false,
} = {}) {
  if (!pickupDate) {
    throw new ApiError(400, "Pickup date is required.");
  }

  if (!allowPastForAdminEdit) {
    const today = todayUtcMidnight();
    if (pickupDate.getTime() < today.getTime()) {
      throw new ApiError(400, "Pickup date cannot be in the past.");
    }
  }

  if (pickupTime !== undefined && pickupTime !== null && pickupTime !== "" && !isValidTime(pickupTime)) {
    throw new ApiError(400, "Pickup time must be a valid time.");
  }

  if (bookingType === "Round Trip") {
    if (!returnDate) {
      throw new ApiError(400, "Return date is required for a round trip.");
    }
    if (returnTime !== undefined && returnTime !== null && returnTime !== "" && !isValidTime(returnTime)) {
      throw new ApiError(400, "Return time must be a valid time.");
    }
    if (returnDate.getTime() < pickupDate.getTime()) {
      throw new ApiError(400, "Return date cannot be before the pickup date.");
    }
    if (
      returnDate.getTime() === pickupDate.getTime() &&
      isValidTime(pickupTime) &&
      isValidTime(returnTime) &&
      returnTime <= pickupTime
    ) {
      throw new ApiError(400, "Return time must be after the pickup time on the same day.");
    }
  }
}

export function assertValidPassengers(passengers, { max = 50 } = {}) {
  if (passengers === undefined || passengers === null || passengers === "") return 1;
  const value = Number(passengers);
  if (!Number.isFinite(value) || value < 1 || value > max) {
    throw new ApiError(400, `Passengers must be between 1 and ${max}.`);
  }
  return Math.round(value);
}
