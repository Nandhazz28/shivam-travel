import { Router } from "express";
import Vehicle from "../models/Vehicle.js";
import Service from "../models/Service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPublicSeoSettings, updatePageSeo } from "../controllers/seoController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/settings", getPublicSeoSettings);
router.put("/settings/:page", requireAdmin, updatePageSeo);

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

function safeIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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

router.get(
  "/sitemap.xml",
  asyncHandler(async (req, res) => {
    const siteUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

    let vehicles = [];
    try {
      vehicles = await Vehicle.find({ isActive: true }).select("slug updatedAt").lean();
    } catch {
      vehicles = [];
    }

    void Service;

    const urlEntries = [
      ...STATIC_PUBLIC_PATHS.map(
        ({ path, priority }) =>
          `  <url><loc>${escapeXml(siteUrl + path)}</loc><priority>${priority}</priority></url>`,
      ),
      ...vehicles
        .filter((v) => v.slug)
        .map((v) => {
          const lastmod = safeIsoDate(v.updatedAt);
          return `  <url><loc>${escapeXml(`${siteUrl}/vehicles/${v.slug}`)}</loc>${
            lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
          }<priority>0.8</priority></url>`;
        }),
    ];

    const seen = new Set();
    const uniqueEntries = urlEntries.filter((entry) => {
      if (seen.has(entry)) return false;
      seen.add(entry);
      return true;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueEntries.join("\n")}\n</urlset>\n`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  }),
);

router.get("/robots.txt", (req, res) => {
  const siteUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const adminPath = process.env.ADMIN_PUBLIC_PATH || "secure-admin";

  const body = [
    "User-agent: *",
    "Allow: /",
    `Disallow: /${adminPath}`,
    "Disallow: /api/",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");

  res.type("text/plain").send(body);
});

export default router;
