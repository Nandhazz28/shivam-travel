import slugify from "slugify";
import Vehicle from "../models/Vehicle.js";
import Pricing from "../models/Pricing.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

async function generateUniqueSlug(name) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let counter = 1;

  while (await Vehicle.findOne({ slug })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

async function attachPricingSummary(vehicles) {
  const ids = vehicles.map((v) => v._id);
  const pricingDocs = ids.length
    ? await Pricing.find({
        vehicle: { $in: ids },
        status: "Active",
        chargeType: { $in: ["Per Km", "Per Hour"] },
      })
        .select("vehicle chargeType rate")
        .lean()
    : [];

  const byVehicle = new Map();
  for (const doc of pricingDocs) {
    const key = String(doc.vehicle);
    const entry = byVehicle.get(key) || {};
    if (doc.chargeType === "Per Km" && entry.perKm === undefined) entry.perKm = doc.rate;
    if (doc.chargeType === "Per Hour" && entry.perHour === undefined) entry.perHour = doc.rate;
    byVehicle.set(key, entry);
  }

  return vehicles.map((v) => {
    const configured = byVehicle.get(String(v._id)) || {};
    const perKm =
      configured.perKm !== undefined
        ? configured.perKm
        : v.pricePerKm > 0
          ? v.pricePerKm
          : undefined;
    return {
      ...v,
      pricingSummary: {
        perKm,
        perHour: configured.perHour,
      },
    };
  });
}

export const listVehicles = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { isActive: true };

  const vehicles = await Vehicle.find(filter).sort({ displayOrder: 1, createdAt: 1 }).lean();
  const withPricing = await attachPricingSummary(vehicles);
  res.json({ success: true, data: withPricing });
});

export const getVehicleBySlugOrId = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const vehicle = await Vehicle.findOne({
    $or: [{ slug: idOrSlug }, { _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null }],
  }).lean();
  if (!vehicle) throw new ApiError(404, "Vehicle not found.");
  const [withPricing] = await attachPricingSummary([vehicle]);
  res.json({ success: true, data: withPricing });
});

export const createVehicle = asyncHandler(async (req, res) => {
  const nameEn = req.body?.name?.en;
  if (!nameEn) throw new ApiError(400, "Vehicle name (English) is required.");

  const slug = await generateUniqueSlug(nameEn);
  const vehicle = await Vehicle.create({ ...req.body, slug });
  res.status(201).json({ success: true, data: vehicle, message: "Vehicle created." });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new ApiError(404, "Vehicle not found.");

  Object.assign(vehicle, req.body);

  if (req.body?.name?.en && req.body.name.en !== vehicle.name.en) {
    vehicle.slug = await generateUniqueSlug(req.body.name.en);
  }

  await vehicle.save();
  res.json({ success: true, data: vehicle, message: "Vehicle updated." });
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new ApiError(404, "Vehicle not found.");

  await Promise.all((vehicle.images || []).map((img) => deleteFromCloudinary(img.publicId)));
  await vehicle.deleteOne();

  res.json({ success: true, message: "Vehicle deleted." });
});

export const toggleVehicleActive = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new ApiError(404, "Vehicle not found.");
  vehicle.isActive = !vehicle.isActive;
  await vehicle.save();
  res.json({ success: true, data: vehicle });
});

export const uploadVehicleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw new ApiError(400, "No files uploaded.");
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new ApiError(404, "Vehicle not found.");

  const uploads = await Promise.all(
    req.files.map((file) => uploadBufferToCloudinary(file.buffer, "shivam-travels/vehicles"))
  );

  const newImages = uploads.map((r) => ({ url: r.secure_url, publicId: r.public_id }));
  vehicle.images.push(...newImages);
  await vehicle.save();

  res.json({ success: true, data: vehicle.images, message: "Images uploaded." });
});

export const removeVehicleImage = asyncHandler(async (req, res) => {
  const { id, publicId } = req.params;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new ApiError(404, "Vehicle not found.");

  await deleteFromCloudinary(publicId);
  vehicle.images = vehicle.images.filter((img) => img.publicId !== publicId);
  await vehicle.save();

  res.json({ success: true, data: vehicle.images, message: "Image removed." });
});

export const reorderVehicles = asyncHandler(async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) throw new ApiError(400, "order array is required.");

  await Promise.all(
    order.map(({ id, displayOrder }) => Vehicle.findByIdAndUpdate(id, { displayOrder }))
  );

  res.json({ success: true, message: "Vehicle order updated." });
});
