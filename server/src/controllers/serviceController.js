import Service from "../models/Service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

export const listServices = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { isActive: true };
  const services = await Service.find(filter).sort({ displayOrder: 1, createdAt: 1 }).lean();
  res.json({ success: true, data: services });
});

export const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Service not found.");
  res.json({ success: true, data: service });
});

export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: service, message: "Service created." });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) throw new ApiError(404, "Service not found.");
  res.json({ success: true, data: service, message: "Service updated." });
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Service not found.");
  if (service.image?.publicId) await deleteFromCloudinary(service.image.publicId);
  await service.deleteOne();
  res.json({ success: true, message: "Service deleted." });
});

export const toggleServiceActive = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Service not found.");
  service.isActive = !service.isActive;
  await service.save();
  res.json({ success: true, data: service });
});

export const uploadServiceImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded.");
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Service not found.");

  if (service.image?.publicId) await deleteFromCloudinary(service.image.publicId);
  const result = await uploadBufferToCloudinary(req.file.buffer, "shivam-travels/services");
  service.image = { url: result.secure_url, publicId: result.public_id };
  await service.save();

  res.json({ success: true, data: service.image, message: "Service image updated." });
});
