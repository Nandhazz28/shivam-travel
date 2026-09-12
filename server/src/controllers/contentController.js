import WebsiteContent from "../models/WebsiteContent.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

function deepMerge(base, override) {
  if (typeof base !== "object" || base === null) return override ?? base;
  const result = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(override || {})) {
    if (
      typeof override[key] === "object" &&
      override[key] !== null &&
      !Array.isArray(override[key]) &&
      typeof base[key] === "object"
    ) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

export const getAllContent = asyncHandler(async (req, res) => {
  const docs = await WebsiteContent.find({ isActive: true });
  const bySection = {};
  docs.forEach((doc) => {
    bySection[doc.section] = doc.content;
  });
  res.json({ success: true, data: bySection });
});

export const getSectionContent = asyncHandler(async (req, res) => {
  const doc = await WebsiteContent.findOne({ section: req.params.section, isActive: true });
  res.json({ success: true, data: doc ? doc.content : null });
});

export const updateSectionContent = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const { content } = req.body;
  if (!content || typeof content !== "object") {
    throw new ApiError(400, "content object is required.");
  }

  let doc = await WebsiteContent.findOne({ section });
  if (!doc) {
    doc = await WebsiteContent.create({ section, content });
  } else {
    doc.content = deepMerge(doc.content || {}, content);
    await doc.save();
  }

  res.json({ success: true, data: doc.content, message: `Content for "${section}" saved.` });
});

export const bulkUpdateContent = asyncHandler(async (req, res) => {
  const { sections } = req.body;
  if (!sections || typeof sections !== "object") {
    throw new ApiError(400, "sections object is required.");
  }

  const results = {};
  for (const [section, content] of Object.entries(sections)) {
    let doc = await WebsiteContent.findOne({ section });
    if (!doc) {
      doc = await WebsiteContent.create({ section, content });
    } else {
      doc.content = deepMerge(doc.content || {}, content);
      await doc.save();
    }
    results[section] = doc.content;
  }

  res.json({ success: true, data: results, message: "Website content updated." });
});

export const restoreSectionDefault = asyncHandler(async (req, res) => {
  await WebsiteContent.deleteOne({ section: req.params.section });
  res.json({ success: true, message: `Section "${req.params.section}" restored to default.` });
});
