import FAQ from "../models/FAQ.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const listFaqs = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { status: "Published" };
  const faqs = await FAQ.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  res.json({ success: true, data: faqs });
});

export const createFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.create(req.body);
  res.status(201).json({ success: true, data: faq, message: "FAQ added." });
});

export const updateFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!faq) throw new ApiError(404, "FAQ not found.");
  res.json({ success: true, data: faq, message: "FAQ updated." });
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndDelete(req.params.id);
  if (!faq) throw new ApiError(404, "FAQ not found.");
  res.json({ success: true, message: "FAQ removed." });
});
