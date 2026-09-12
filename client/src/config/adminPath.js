export const ADMIN_BASE = `/${(import.meta.env.VITE_ADMIN_PATH || "secure-admin").replace(/^\/|\/$/g, "")}`;

export const adminPath = (suffix = "") => `${ADMIN_BASE}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
