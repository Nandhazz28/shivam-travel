import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, unique: true },
    sourceEnquiry: { type: mongoose.Schema.Types.ObjectId, ref: "Enquiry", index: true },
    customerName: String,
    customerPhone: String,
    customerEmail: String,
    pickupLocation: String,
    dropLocation: String,
    travelDate: Date,
    pickupTime: String,
    returnDate: Date,
    returnTime: String,
    passengers: Number,
    luggage: String,
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    bookingType: { type: String, enum: ["One Way", "Round Trip"], default: "One Way" },
    tripType: {
      type: String,
      enum: ["Local", "Outstation", "Airport", "One Day Tour", "Corporate", "Family Trip", "Other"],
      default: "Other",
    },
    source: { type: String, enum: ["public_booking_form", "enquiry_conversion", "admin"], default: "admin" },
    pricingSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    distanceKm: { type: Number, default: null },
    durationHours: { type: Number, default: null },
    basePrice: { type: Number, default: 0, min: [0, "basePrice cannot be negative."] },
    driverCharges: { type: Number, default: 0, min: [0, "driverCharges cannot be negative."] },
    extraCharges: { type: Number, default: 0, min: [0, "extraCharges cannot be negative."] },
    discount: { type: Number, default: 0, min: [0, "discount cannot be negative."] },
    tax: { type: Number, default: 0, min: [0, "tax cannot be negative."] },
    totalAmount: { type: Number, default: 0, min: [0, "totalAmount cannot be negative."] },

    originalTotalAmount: { type: Number, default: null },

    totalOverridden: { type: Boolean, default: false },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Refunded"], default: "Pending" },
    paymentMethod: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    specialNotes: String,
    history: [
      {
        action: String,
        performedBy: String,
        remarks: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

bookingSchema.pre("save", async function assignCode(next) {
  if (this.bookingCode) return next();
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await mongoose.model("Booking").countDocuments();
  this.bookingCode = `BK${datePart}${String(count + 1).padStart(2, "0")}`;
  next();
});

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1 });

export default mongoose.model("Booking", bookingSchema);
