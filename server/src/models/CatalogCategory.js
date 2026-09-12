import mongoose from "mongoose";
import { bilingualField } from "./shared/bilingual.js";

export const CATALOG_CATEGORIES = ["Sedan", "SUV", "Premium SUV", "Hatchback"];

const catalogCategorySchema = new mongoose.Schema(
  {

    category: {
      type: String,
      enum: CATALOG_CATEGORIES,
      required: true,
      unique: true,
    },

    title: bilingualField({ required: true }),
    description: bilingualField(),

    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    catalogUrl: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

catalogCategorySchema.index({ displayOrder: 1 });

catalogCategorySchema.pre("save", function setDefaultCatalogUrl(next) {
  if (!this.catalogUrl) {
    this.catalogUrl = `/vehicles?category=${encodeURIComponent(this.category)}`;
  }
  next();
});

export default mongoose.model("CatalogCategory", catalogCategorySchema);
