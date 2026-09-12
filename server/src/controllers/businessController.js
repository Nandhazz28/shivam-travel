import BusinessSettings from "../models/BusinessSettings.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

export const getBusinessSettings = asyncHandler(async (req, res) => {
  const settings = await BusinessSettings.getSingleton();
  res.json({ success: true, data: settings });
});

export const updateBusinessSettings = asyncHandler(async (req, res) => {
  const settings = await BusinessSettings.getSingleton();
  const updatable = [
    "businessName",
    "tagline",
    "shortDescription",
    "about",
    "heroContent",
    "phone",
    "whatsapp",
    "whatsappDefaultMessage",
    "email",
    "address",
    "mapLink",
    "workingHours",
    "socialLinks",
    "stats",
    "notifications",
  ];
  updatable.forEach((key) => {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  });
  await settings.save();
  res.json({ success: true, data: settings, message: "Business settings updated." });
});

export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

  const settings = await BusinessSettings.getSingleton();
  if (settings.logo?.publicId) await deleteFromCloudinary(settings.logo.publicId);

  const result = await uploadBufferToCloudinary(req.file.buffer, "shivam-travels/logo");
  settings.logo = { url: result.secure_url, publicId: result.public_id };
  await settings.save();

  res.json({ success: true, data: settings.logo, message: "Logo updated." });
});

export const uploadHeroImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

  const settings = await BusinessSettings.getSingleton();
  const result = await uploadBufferToCloudinary(req.file.buffer, "shivam-travels/hero");
  settings.heroImages.push({ url: result.secure_url, publicId: result.public_id });
  await settings.save();

  res.json({ success: true, data: settings.heroImages, message: "Hero image added." });
});

export const deleteHeroImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const settings = await BusinessSettings.getSingleton();
  await deleteFromCloudinary(publicId);
  settings.heroImages = settings.heroImages.filter((img) => img.publicId !== publicId);
  await settings.save();
  res.json({ success: true, data: settings.heroImages, message: "Hero image removed." });
});
