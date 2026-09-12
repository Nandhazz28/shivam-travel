import CatalogCategory from "../models/CatalogCategory.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

export const listCatalog = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { isActive: true };
  const categories = await CatalogCategory.find(filter).sort({ displayOrder: 1, createdAt: 1 }).lean();
  res.json({ success: true, data: categories });
});

export const getCatalogById = asyncHandler(async (req, res) => {
  const category = await CatalogCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Catalog category not found.");
  res.json({ success: true, data: category });
});

export const createCatalogCategory = asyncHandler(async (req, res) => {
  const category = await CatalogCategory.create(req.body);
  res.status(201).json({ success: true, data: category, message: "Catalog category created." });
});

export const updateCatalogCategory = asyncHandler(async (req, res) => {
  const category = await CatalogCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Catalog category not found.");

  const { category: _ignored, ...updatable } = req.body;
  Object.assign(category, updatable);
  await category.save();

  res.json({ success: true, data: category, message: "Catalog category updated." });
});

export const updateCatalogStatus = asyncHandler(async (req, res) => {
  const category = await CatalogCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Catalog category not found.");

  if (typeof req.body.isActive === "boolean") {
    category.isActive = req.body.isActive;
  } else {
    category.isActive = !category.isActive;
  }
  await category.save();

  res.json({ success: true, data: category, message: "Catalog status updated." });
});

export const updateCatalogAvailability = asyncHandler(async (req, res) => {
  const category = await CatalogCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Catalog category not found.");

  if (typeof req.body.isAvailable === "boolean") {
    category.isAvailable = req.body.isAvailable;
  } else {
    category.isAvailable = !category.isAvailable;
  }
  await category.save();

  res.json({ success: true, data: category, message: "Catalog availability updated." });
});

export const deleteCatalogCategory = asyncHandler(async (req, res) => {
  const category = await CatalogCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Catalog category not found.");

  if (category.image?.publicId) {
    await deleteFromCloudinary(category.image.publicId);
  }
  await category.deleteOne();

  res.json({ success: true, message: "Catalog category deleted." });
});

export const uploadCatalogImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded.");

  const category = await CatalogCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Catalog category not found.");

  const previousPublicId = category.image?.publicId;

  const result = await uploadBufferToCloudinary(req.file.buffer, "shivam-travels/catalog");
  category.image = { url: result.secure_url, publicId: result.public_id };
  await category.save();

  if (previousPublicId) {
    await deleteFromCloudinary(previousPublicId);
  }

  res.json({ success: true, data: category, message: "Catalog image uploaded." });
});

export const removeCatalogImage = asyncHandler(async (req, res) => {
  const category = await CatalogCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Catalog category not found.");

  if (category.image?.publicId) {
    await deleteFromCloudinary(category.image.publicId);
  }
  category.image = { url: "", publicId: "" };
  await category.save();

  res.json({ success: true, data: category, message: "Catalog image removed." });
});
