import mongoose from "mongoose";

const websiteContentSchema = new mongoose.Schema(
  {
    section: { type: String, required: true, unique: true, index: true },

    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    contentType: { type: String, default: "text" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("WebsiteContent", websiteContentSchema);
