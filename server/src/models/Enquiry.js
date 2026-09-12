import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    mobile: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, default: "", maxlength: 254 },
    tripType: {
      type: String,
      enum: ["Outstation", "Local", "Airport", "One Day Tour", "Corporate", "Family Trip", "Other"],
      default: "Other",
    },
    pickupLocation: { type: String, default: "", maxlength: 200 },
    dropLocation: { type: String, default: "", maxlength: 200 },
    pickupDate: { type: Date },
    pickupTime: { type: String, default: "" },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    passengers: {
      type: Number,
      default: 1,
      min: [1, "passengers must be at least 1."],
      max: [50, "passengers cannot exceed 50."],
    },
    luggage: { type: String, default: "", maxlength: 200 },
    message: { type: String, default: "", maxlength: 2000 },
    estimatedTotal: { type: Number, default: 0, min: [0, "estimatedTotal cannot be negative."] },
    status: {
      type: String,
      enum: ["New", "Contacted", "Confirmed", "Completed", "Cancelled"],
      default: "New",
      index: true,
    },
    source: { type: String, enum: ["website_form", "booking_form", "admin"], default: "website_form" },
  },
  { timestamps: true }
);

enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ name: "text", mobile: "text", email: "text" });

export default mongoose.model("Enquiry", enquirySchema);
