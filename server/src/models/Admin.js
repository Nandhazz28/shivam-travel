import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: [
        "Administrator",
        "Manager",
        "Booking Staff",
        "Driver",
        "Customer Support",
      ],
      default: "Administrator",
    },
    isActive: { type: Boolean, default: true },

    resetOtpHash: { type: String, select: false },
    resetOtpExpires: { type: Date, select: false },
    resetOtpAttempts: { type: Number, default: 0, select: false },
    resetOtpVerified: { type: Boolean, default: false, select: false },
    resetOtpLastSentAt: { type: Date, select: false },

    tokenVersion: { type: Number, default: 0 },

    refreshTokenHash: { type: String, select: false },
    refreshTokenExpires: { type: Date, select: false },

    previousRefreshTokenHash: { type: String, select: false },
    previousRefreshTokenExpires: { type: Date, select: false },

    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
  },
  { timestamps: true },
);

adminSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

adminSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

export default mongoose.model("Admin", adminSchema);
