export const REFRESH_COOKIE_NAME = "shivam_admin_refresh";

const COOKIE_PATH = "/api/auth/admin";

export function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: COOKIE_PATH,
    maxAge: (Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30) * 24 * 60 * 60 * 1000,
  };
}

export function clearRefreshCookieOptions() {
  const { maxAge, ...rest } = refreshCookieOptions();
  return rest;
}
