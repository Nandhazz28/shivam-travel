import mongoose from "mongoose";
import Vehicle from "../models/Vehicle.js";
import Pricing from "../models/Pricing.js";
import { ApiError } from "./ApiError.js";
import { calculateBookingPrice } from "./pricingCalculator.js";

const TRIP_TYPE_FALLBACK_ORDER = ["Outstation", "Local", "Airport", "Package"];

export async function findActivePricing(vehicleId, tripType) {
  if (!vehicleId) return null;

  const candidates = await Pricing.find({ vehicle: vehicleId, status: "Active" }).lean();
  if (candidates.length === 0) return null;

  if (tripType) {
    const exact = candidates.find((p) => p.tripType === tripType);
    if (exact) return exact;
  }

  for (const type of TRIP_TYPE_FALLBACK_ORDER) {
    const match = candidates.find((p) => p.tripType === type);
    if (match) return match;
  }

  return candidates[0];
}

export async function getTrustedVehicleQuote(
  vehicleId,
  { requireAvailable = true, tripType, distanceKm, durationHours } = {},
) {
  if (!vehicleId) {
    return { vehicle: null, pricing: null, estimatedTotal: 0, breakdown: null };
  }

  if (!mongoose.isValidObjectId(vehicleId)) {
    throw new ApiError(400, "Invalid vehicle selected.");
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle || !vehicle.isActive) {
    throw new ApiError(400, "Selected vehicle could not be found.");
  }

  if (requireAvailable && vehicle.status !== "Available") {
    throw new ApiError(
      400,
      "The selected vehicle is currently not available. Please choose a different vehicle.",
    );
  }

  const pricing = await findActivePricing(vehicle._id, tripType);

  const effectiveDistance =
    distanceKm !== undefined && distanceKm !== null
      ? Number(distanceKm)
      : vehicle.minimumKmPerDay || 0;
  const effectiveDuration =
    durationHours !== undefined && durationHours !== null ? Number(durationHours) : 8;

  let breakdown;
  if (pricing) {
    breakdown = calculateBookingPrice({
      pricing,
      distanceKm: effectiveDistance,
      durationHours: effectiveDuration,
    });
  } else {
    const legacyRate = Number(vehicle.pricePerKm) || 0;
    const legacyTotal = Math.max(0, legacyRate * effectiveDistance);
    breakdown = {
      chargeType: "Per Km",
      basePrice: legacyTotal,
      driverCharges: 0,
      extraCharges: 0,
      discount: 0,
      tax: 0,
      totalAmount: legacyTotal,
      calculationDetails: {
        note: "Legacy pricePerKm estimate — no Pricing record configured for this vehicle yet.",
        rate: legacyRate,
        distanceKm: effectiveDistance,
      },
    };
  }

  return {
    vehicle,
    pricing,
    estimatedTotal: breakdown.totalAmount,
    breakdown,
  };
}
