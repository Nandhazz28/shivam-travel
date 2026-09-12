import PageSEO, { SEO_PAGES } from "../models/PageSEO.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const BILINGUAL_FIELDS = [
  "title",
  "metaDescription",
  "metaKeywords",
  "ogTitle",
  "ogDescription",
  "twitterTitle",
  "twitterDescription",
];
const URL_FIELDS = ["ogImage", "canonicalUrl", "twitterImage"];

const MAX_LENGTHS = {
  title: 70,
  metaDescription: 180,
  metaKeywords: 255,
  ogTitle: 70,
  ogDescription: 180,
  twitterTitle: 70,
  twitterDescription: 180,
};

function isValidUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeSeoInput(body = {}) {
  const clean = {};
  const errors = [];

  for (const field of BILINGUAL_FIELDS) {
    const raw = body[field];
    if (raw === undefined) continue;
    const en = typeof raw?.en === "string" ? raw.en.trim() : "";
    const ta = typeof raw?.ta === "string" ? raw.ta.trim() : "";
    const max = MAX_LENGTHS[field];
    if (en.length > max || ta.length > max) {
      errors.push(`${field} must be ${max} characters or fewer.`);
      continue;
    }
    clean[field] = { en, ta };
  }

  for (const field of URL_FIELDS) {
    const raw = body[field];
    if (raw === undefined) continue;
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!isValidUrl(value)) {
      errors.push(`${field} must be a valid http(s) URL.`);
      continue;
    }
    clean[field] = value;
  }

  return { clean, errors };
}

export const getPublicSeoSettings = asyncHandler(async (req, res) => {
  const map = await PageSEO.getAllAsMap();
  res.json({ success: true, data: map, pages: SEO_PAGES });
});

export const updatePageSeo = asyncHandler(async (req, res) => {
  const { page } = req.params;
  if (!SEO_PAGES.includes(page)) {
    throw new ApiError(
      400,
      `Unknown page "${page}". Must be one of: ${SEO_PAGES.join(", ")}.`,
    );
  }

  const { clean, errors } = sanitizeSeoInput(req.body);
  if (errors.length > 0) {
    throw new ApiError(422, errors.join(" "));
  }
  if (Object.keys(clean).length === 0) {
    throw new ApiError(400, "No valid SEO fields provided.");
  }

  const updated = await PageSEO.upsertForPage(page, clean);
  res.json({ success: true, data: updated, message: "SEO settings updated." });
});
