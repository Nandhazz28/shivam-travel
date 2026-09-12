import mongoose from "mongoose";
import { bilingualField } from "./shared/bilingual.js";

const serviceSchema = new mongoose.Schema(
  {
    name: bilingualField({ required: true }),
    description: bilingualField(),
    icon: { type: String, default: "car" },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    priceLabel: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seoTitle: bilingualField(),
    seoDescription: bilingualField(),
  },
  { timestamps: true }
);

serviceSchema.index({ displayOrder: 1 });

export default mongoose.model("Service", serviceSchema);
