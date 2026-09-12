import mongoose from "mongoose";
import { bilingualField } from "./shared/bilingual.js";

const businessSettingsSchema = new mongoose.Schema(
  {
    businessName: { type: String, default: "Shivam Travels" },
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    tagline: bilingualField(),
    shortDescription: bilingualField(),
    about: bilingualField(),
    heroContent: {
      title: bilingualField(),
      subtitle: bilingualField(),
      description: bilingualField(),
    },
    heroImages: [
      {
        url: String,
        publicId: String,
      },
    ],
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    whatsappDefaultMessage: bilingualField(),
    email: { type: String, default: "" },
    address: bilingualField(),
    mapLink: { type: String, default: "" },
    workingHours: { type: String, default: "" },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },

    stats: {
      happyCustomers: { type: Number, default: 0 },
      successfulTrips: { type: Number, default: 0 },
      yearsExperience: { type: Number, default: 0 },
      outstationDestinations: { type: Number, default: 0 },
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: true },
      bookingAutoConfirmation: { type: Boolean, default: false },
      darkMode: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

businessSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

export default mongoose.model("BusinessSettings", businessSettingsSchema);
