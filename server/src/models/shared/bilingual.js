import mongoose from "mongoose";

export function bilingualField({ required = false } = {}) {
  return new mongoose.Schema(
    {
      en: { type: String, required, trim: true, default: "" },
      ta: { type: String, trim: true, default: "" },
    },
    { _id: false }
  );
}
