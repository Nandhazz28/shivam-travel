import mongoose from "mongoose";
import { bilingualField } from "./shared/bilingual.js";

const faqSchema = new mongoose.Schema(
  {
    question: bilingualField({ required: true }),
    answer: bilingualField({ required: true }),
    category: {
      type: String,
      enum: ["General", "Booking", "Vehicles", "Services", "Drivers", "Payments"],
      default: "General",
    },
    status: { type: String, enum: ["Published", "Hidden"], default: "Published" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("FAQ", faqSchema);
