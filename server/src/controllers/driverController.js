import Driver from "../models/Driver.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

export const listDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.find().populate("assignedVehicle", "name").sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: drivers });
});

export const createDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.create(req.body);
  res.status(201).json({ success: true, data: driver, message: "Driver added." });
});

export const updateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!driver) throw new ApiError(404, "Driver not found.");
  res.json({ success: true, data: driver, message: "Driver updated." });
});

export const deleteDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) throw new ApiError(404, "Driver not found.");
  if (driver.photo?.publicId) await deleteFromCloudinary(driver.photo.publicId);
  await driver.deleteOne();
  res.json({ success: true, message: "Driver removed." });
});

export const uploadDriverPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded.");
  const driver = await Driver.findById(req.params.id);
  if (!driver) throw new ApiError(404, "Driver not found.");
  if (driver.photo?.publicId) await deleteFromCloudinary(driver.photo.publicId);
  const result = await uploadBufferToCloudinary(req.file.buffer, "shivam-travels/drivers");
  driver.photo = { url: result.secure_url, publicId: result.public_id };
  await driver.save();
  res.json({ success: true, data: driver.photo });
});
