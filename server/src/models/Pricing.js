import mongoose from "mongoose";

export const CHARGE_TYPES = ["Package", "Per Km", "Per Hour", "Fixed"];

const nonNegative = [0, "{PATH} cannot be negative."];

const pricingSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    category: { type: String, default: "" },
    tripType: { type: String, enum: ["Local", "Outstation", "Airport", "Package"], default: "Local" },
    chargeType: { type: String, enum: CHARGE_TYPES, default: "Package" },
    rate: { type: Number, required: true, min: nonNegative },
    packageHours: { type: Number, default: null, min: nonNegative },
    packageKm: { type: Number, default: null, min: nonNegative },
    extraKmRate: { type: Number, default: 0, min: nonNegative },
    extraHourRate: { type: Number, default: 0, min: nonNegative },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

pricingSchema.index({ vehicle: 1, tripType: 1, status: 1 });

export default mongoose.model("Pricing", pricingSchema);
