import mongoose from "mongoose";
import Pricing, { CHARGE_TYPES } from "../models/Pricing.js";
import Vehicle from "../models/Vehicle.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { formatPricingDisplay } from "../utils/pricingCalculator.js";

const ALLOWED_FIELDS = [
  "vehicle",
  "category",
  "tripType",
  "chargeType",
  "rate",
  "packageHours",
  "packageKm",
  "extraKmRate",
  "extraHourRate",
  "status",
];

function pickAllowed(body) {
  const clean = {};
  ALLOWED_FIELDS.forEach((key) => {
    if (body[key] !== undefined) clean[key] = body[key];
  });
  return clean;
}

function assertNonNegative(value, label) {
  if (value === undefined || value === null || value === "") return;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new ApiError(400, `${label} must be a valid number of 0 or more.`);
  }
}

function validatePricingPayload(payload, { partial = false } = {}) {
  if (payload.chargeType !== undefined && !CHARGE_TYPES.includes(payload.chargeType)) {
    throw new ApiError(400, `chargeType must be one of: ${CHARGE_TYPES.join(", ")}.`);
  }

  assertNonNegative(payload.rate, "Rate");
  assertNonNegative(payload.packageHours, "Package hours");
  assertNonNegative(payload.packageKm, "Package km");
  assertNonNegative(payload.extraKmRate, "Extra km rate");
  assertNonNegative(payload.extraHourRate, "Extra hour rate");

  if (!partial && payload.rate === undefined) {
    throw new ApiError(400, "Rate is required.");
  }

  if (payload.chargeType === "Package") {
    const hasHours = payload.packageHours !== undefined && payload.packageHours !== null && payload.packageHours !== "";
    const hasKm = payload.packageKm !== undefined && payload.packageKm !== null && payload.packageKm !== "";
    if (!partial && !hasHours && !hasKm) {
      throw new ApiError(400, "A package must specify package hours and/or package km.");
    }
  }
}

export const listPricing = asyncHandler(async (req, res) => {
  const { vehicle, all } = req.query;
  const filter = {};
  if (vehicle) filter.vehicle = String(vehicle);
  if (all !== "true") filter.status = "Active";
  const pricing = await Pricing.find(filter).populate("vehicle", "name category registrationNumber").sort({ createdAt: -1 }).lean();
  const withDisplay = pricing.map((p) => ({ ...p, display: formatPricingDisplay(p) }));
  res.json({ success: true, data: withDisplay });
});

export const createPricing = asyncHandler(async (req, res) => {
  const payload = pickAllowed(req.body);

  if (!payload.vehicle || !mongoose.isValidObjectId(payload.vehicle)) {
    throw new ApiError(400, "A valid vehicle must be selected.");
  }
  const vehicleExists = await Vehicle.exists({ _id: payload.vehicle });
  if (!vehicleExists) throw new ApiError(400, "Selected vehicle could not be found.");

  validatePricingPayload(payload);

  const pricing = await Pricing.create(payload);
  res.status(201).json({ success: true, data: pricing, message: "Price added." });
});

export const updatePricing = asyncHandler(async (req, res) => {
  const payload = pickAllowed(req.body);

  if (payload.vehicle !== undefined) {
    if (!mongoose.isValidObjectId(payload.vehicle)) throw new ApiError(400, "Invalid vehicle selected.");
    const vehicleExists = await Vehicle.exists({ _id: payload.vehicle });
    if (!vehicleExists) throw new ApiError(400, "Selected vehicle could not be found.");
  }

  validatePricingPayload(payload, { partial: true });

  const pricing = await Pricing.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!pricing) throw new ApiError(404, "Price entry not found.");
  res.json({ success: true, data: pricing, message: "Price updated." });
});

export const deletePricing = asyncHandler(async (req, res) => {
  const pricing = await Pricing.findByIdAndDelete(req.params.id);
  if (!pricing) throw new ApiError(404, "Price entry not found.");
  res.json({ success: true, message: "Price entry removed." });
});
