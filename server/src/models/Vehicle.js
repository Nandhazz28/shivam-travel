import mongoose from "mongoose";
import { bilingualField } from "./shared/bilingual.js";

export const VEHICLE_CATEGORIES = ["Hatchback", "Sedan", "SUV", "Premium SUV"];

const CATEGORY_ALIASES = {
  hatchback: "Hatchback",
  suv: "SUV",
  "luxury suv": "Premium SUV",
  sedan: "Sedan",
  premiumsuv: "Premium SUV",
};

export function normalizeVehicleCategory(value) {
  if (!value || typeof value !== "string") return value;
  const trimmed = value.trim();
  if (VEHICLE_CATEGORIES.includes(trimmed)) return trimmed;
  const alias = CATEGORY_ALIASES[trimmed.toLowerCase()];
  return alias || trimmed;
}

const vehicleSchema = new mongoose.Schema(
  {
    name: bilingualField({ required: true }),
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    description: bilingualField(),

    category: {
      type: String,
      enum: VEHICLE_CATEGORIES,
      default: "Sedan",
      set: normalizeVehicleCategory,
    },

    registrationNumber: {
      type: String,
      default: "",
    },

    model: {
      type: String,
      default: "",
    },

    whatsappCatalogUrl: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          if (!value) return true;
          return /^https?:\/\/.+/i.test(value);
        },
        message: "whatsappCatalogUrl must be a valid http:// or https:// URL.",
      },
    },

    images: [
      {
        url: String,
        publicId: String,
      },
    ],

    seatingCapacity: {
      type: Number,
      default: 4,
    },

    luggageCapacity: {
      type: String,
      default: "",
    },

    features: bilingualField(),

    pricePerKm: {
      type: Number,
      default: 0,
    },

    minimumKmPerDay: {
      type: Number,
      default: 250,
    },

    extraKmRate: {
      type: Number,
      default: 0,
    },

    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "CNG", "Electric"],
      default: "Petrol",
    },

    pricingText: bilingualField(),

    status: {
      type: String,
      enum: ["Available", "Not Available"],
      default: "Available",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    seoTitle: bilingualField(),
    seoDescription: bilingualField(),
  },
  { timestamps: true },
);

vehicleSchema.index({ displayOrder: 1 });

export default mongoose.model("Vehicle", vehicleSchema);
