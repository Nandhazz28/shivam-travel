import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    driverId: { type: String, unique: true },
    phone: { type: String, required: true },
    licenseNumber: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    photo: { url: String, publicId: String },
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
    status: { type: String, enum: ["Active", "On Trip", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

driverSchema.pre("save", async function assignId(next) {
  if (this.driverId) return next();
  const count = await mongoose.model("Driver").countDocuments();
  this.driverId = `DRV${String(count + 1).padStart(3, "0")}`;
  next();
});

export default mongoose.model("Driver", driverSchema);
