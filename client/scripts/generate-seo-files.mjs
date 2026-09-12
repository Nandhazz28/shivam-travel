import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");

const clientEnvPath = path.resolve(__dirname, "..", ".env");
try {
  process.loadEnvFile(clientEnvPath);
} catch {}

const SITE_URL = (process.env.VITE_SITE_URL || "http://localhost:5173").replace(
  /\/$/,
  "",
);
const API_URL = (
  process.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");
const ADMIN_PATH = (process.env.VITE_ADMIN_PATH || "secure-admin").replace(
  /^\/|\/$/g,
  "",
);

// Guard against the specific misconfiguration that broke sitemap.xml/robots.txt in
// production: VITE_SITE_URL pointing at a local dev URL (e.g. copied from a local .env)
// while actually running as a real Vercel build. This can't be caught by application code
// at runtime — it only shows up as a broken sitemap after deploy — so fail the BUILD loudly
// instead of silently shipping bad URLs to search engines again.
if (process.env.VERCEL === "1" && /localhost|127\.0\.0\.1/i.test(SITE_URL)) {
  console.error(
    `\n[generate-seo-files] FATAL: VITE_SITE_URL is set to "${SITE_URL}" but this is a ` +
      "real Vercel build (VERCEL=1). Sitemap.xml and robots.txt would be generated with " +
      "localhost URLs and be useless to search engines. Set VITE_SITE_URL to the real " +
      "production frontend URL in Vercel's Project Settings → Environment Variables, " +
      "then redeploy.\n",
  );
  process.exit(1);
}

const STATIC_PUBLIC_PATHS = [
  { path: "/", priority: "1.0" },
  { path: "/about", priority: "0.7" },
  { path: "/services", priority: "0.8" },
  { path: "/vehicles", priority: "0.9" },
  { path: "/booking", priority: "0.9" },
  { path: "/faq", priority: "0.6" },
  { path: "/contact", priority: "0.6" },
];

function escapeXml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

async function fetchVehiclesSafely() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_URL}/vehicles`, {
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    return list.filter((v) => v?.slug && v?.isActive !== false);
  } catch (err) {
    console.warn(
      `[generate-seo-files] Could not fetch vehicles from ${API_URL}/vehicles for the sitemap (${err.message}). ` +
        "Continuing with static pages only — this is non-fatal and won't fail the build.",
    );
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function buildSitemap(vehicles) {
  const urlEntries = [
    ...STATIC_PUBLIC_PATHS.map(
      ({ path: p, priority }) =>
        `  <url><loc>${escapeXml(SITE_URL + p)}</loc><priority>${priority}</priority></url>`,
    ),
    ...vehicles.map((v) => {
      const lastmod =
        v.updatedAt && !Number.isNaN(new Date(v.updatedAt).getTime())
          ? new Date(v.updatedAt).toISOString()
          : null;
      return `  <url><loc>${escapeXml(`${SITE_URL}/vehicles/${v.slug}`)}</loc>${
        lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
      }<priority>0.8</priority></url>`;
    }),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries.join("\n")}\n</urlset>\n`;
}

function buildRobots() {
  return [
    "User-agent: *",
    "Allow: /",
    `Disallow: /${ADMIN_PATH}`,
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

async function main() {
  mkdirSync(distDir, { recursive: true });

  const vehicles = await fetchVehiclesSafely();

  writeFileSync(
    path.join(distDir, "sitemap.xml"),
    buildSitemap(vehicles),
    "utf8",
  );
  writeFileSync(path.join(distDir, "robots.txt"), buildRobots(), "utf8");

  console.log(
    `[generate-seo-files] Wrote dist/sitemap.xml (${vehicles.length} vehicle URL(s) + ${STATIC_PUBLIC_PATHS.length} static URLs) and dist/robots.txt for ${SITE_URL}.`,
  );
}

main().catch((err) => {
  console.error("[generate-seo-files] Unexpected error (non-fatal):", err);
});
