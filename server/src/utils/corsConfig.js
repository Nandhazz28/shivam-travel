function parseHost(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.hostname;
  } catch (e) {
    let s = String(value).trim();
    s = s.replace(/^https?:\/\//i, "").replace(/^:\/\//, "");
    s = s.split("/")[0].replace(/:\d+$/i, "");
    return s;
  }
}

export function getAllowedOrigins() {
  const raw = (
    process.env.ALLOWED_ORIGINS ||
    process.env.CLIENT_URL ||
    (process.env.NODE_ENV !== "production" ? "http://localhost:5173" : "")
  ).toString();

  const origins = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === "production" && origins.length === 0) {
    console.error(
      "[CONFIG ERROR] ALLOWED_ORIGINS or CLIENT_URL must be set in production. Set CLIENT_URL and/or ALLOWED_ORIGINS to the frontend origin.",
    );
    process.exit(1);
  }

  return origins;
}

export function getAllowedOriginHosts() {
  return getAllowedOrigins()
    .map((o) => parseHost(o))
    .filter(Boolean);
}

export function getAllowedOriginsForCSP() {
  return getAllowedOrigins().map((o) => {
    const t = String(o).trim();
    if (/^https?:\/\//i.test(t)) return t.replace(/\/$/, "");
    return `https://${t.replace(/\/$/, "")}`;
  });
}

export function isOriginAllowed(origin) {
  if (!origin) return false;
  let originHost = "";
  try {
    originHost = new URL(origin).hostname;
  } catch (e) {
    originHost = parseHost(origin);
  }

  const allowedHosts = getAllowedOriginHosts();
  if (allowedHosts.includes(originHost)) return true;

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.some((ao) => ao === origin);
}
