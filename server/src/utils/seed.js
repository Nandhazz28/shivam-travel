import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Admin from "../models/Admin.js";
import BusinessSettings from "../models/BusinessSettings.js";
import Service from "../models/Service.js";
import Vehicle from "../models/Vehicle.js";
import FAQ from "../models/FAQ.js";
import CatalogCategory from "../models/CatalogCategory.js";

async function seed() {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL;
  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await Admin.create({
      name: "Shivam Travels",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: "Administrator",
    });
    console.log(
      `[Seed] Admin created: ${adminEmail}. Use the ADMIN_PASSWORD value from your .env to log in.`,
    );
  } else {
    console.log("[Seed] Admin already exists, skipping.");
  }

  await BusinessSettings.getSingleton();

  const serviceCount = await Service.countDocuments();
  if (serviceCount === 0) {
    await Service.insertMany([
      {
        name: { en: "Outstation Trips", ta: "வெளியூர் பயணங்கள்" },
        description: {
          en: "One Way / Round Trip",
          ta: "ஒருவழி / இருவழி பயணம்",
        },
        icon: "car",
        displayOrder: 1,
      },
      {
        name: { en: "Temple Visits", ta: "கோவில் தரிசனம்" },
        description: { en: "Spiritual Journeys", ta: "ஆன்மீக பயணங்கள்" },
        icon: "landmark",
        displayOrder: 2,
      },
      {
        name: { en: "Airport Transfers", ta: "விமான நிலைய போக்குவரத்து" },
        description: { en: "Pick up & Drop", ta: "ஏற்றி இறக்கும் சேவை" },
        icon: "plane",
        displayOrder: 3,
      },
      {
        name: { en: "Corporate Travel", ta: "நிறுவன பயணம்" },
        description: { en: "Business Solutions", ta: "வணிக தீர்வுகள்" },
        icon: "briefcase",
        displayOrder: 4,
      },
      {
        name: { en: "One Day Tours", ta: "ஒரு நாள் சுற்றுலா" },
        description: { en: "Local Sightseeing", ta: "உள்ளூர் சுற்றுலா" },
        icon: "calendar",
        displayOrder: 5,
      },
      {
        name: { en: "Family Trips", ta: "குடும்ப பயணங்கள்" },
        description: { en: "Comfort for Family", ta: "குடும்பத்திற்கு வசதி" },
        icon: "users",
        displayOrder: 6,
      },
    ]);
    console.log("[Seed] Sample services created.");
  }

  const vehicleCount = await Vehicle.countDocuments();
  if (vehicleCount === 0) {
    await Vehicle.insertMany([
      {
        name: { en: "Toyota Etios", ta: "டொயோட்டா எட்டியோஸ்" },
        slug: "toyota-etios",
        category: "Sedan",
        seatingCapacity: 4,
        luggageCapacity: "2 Bags",
        pricePerKm: 12,
        minimumKmPerDay: 250,
        extraKmRate: 12,
        fuelType: "Petrol",
        features: { en: "AC, Driver, Petrol", ta: "ஏசி, ஓட்டுநர், பெட்ரோல்" },
        displayOrder: 1,
      },
      {
        name: { en: "Toyota Innova", ta: "டொயோட்டா இன்னோவா" },
        slug: "toyota-innova",
        category: "SUV",
        seatingCapacity: 7,
        luggageCapacity: "4 Bags",
        pricePerKm: 18,
        minimumKmPerDay: 250,
        extraKmRate: 18,
        fuelType: "Diesel",
        features: { en: "AC, Driver, Diesel", ta: "ஏசி, ஓட்டுநர், டீசல்" },
        displayOrder: 2,
      },
    ]);
    console.log("[Seed] Sample vehicles created.");
  }

  const faqCount = await FAQ.countDocuments();
  if (faqCount === 0) {
    await FAQ.insertMany([
      {
        question: {
          en: "What services does Shivam Travels provide?",
          ta: "சிவம் டிராவல்ஸ் என்ன சேவைகளை வழங்குகிறது?",
        },
        answer: {
          en: "We offer outstation trips, local car with driver, airport transfers, corporate travel, one day tours and family trips.",
          ta: "வெளியூர் பயணங்கள், ஓட்டுநருடன் உள்ளூர் கார், விமான நிலைய போக்குவரத்து, நிறுவன பயணம் மற்றும் குடும்ப பயணங்களை நாங்கள் வழங்குகிறோம்.",
        },
        category: "General",
        order: 1,
      },
      {
        question: {
          en: "How can I book a car with driver?",
          ta: "ஓட்டுநருடன் காரை எப்படி முன்பதிவு செய்வது?",
        },
        answer: {
          en: "You can call us, message on WhatsApp, or use the Book Your Ride form on our website.",
          ta: "எங்களை அழைக்கவும், வாட்ஸ்அப்பில் அனுப்பவும் அல்லது எங்கள் இணையதளத்தில் முன்பதிவு படிவத்தைப் பயன்படுத்தவும்.",
        },
        category: "Booking",
        order: 2,
      },
    ]);
    console.log("[Seed] Sample FAQs created.");
  }

  const catalogCount = await CatalogCategory.countDocuments();
  if (catalogCount === 0) {
    await CatalogCategory.insertMany([
      {
        category: "Sedan",
        title: { en: "Sedan", ta: "Sedan" },
        description: {
          en: "Comfortable sedan cars suitable for city travel, airport transfers, business trips, and outstation journeys.",
          ta: "நகர பயணம், விமான நிலைய போக்குவரத்து, வணிக பயணங்கள் மற்றும் வெளியூர் பயணங்களுக்கு ஏற்ற வசதியான Sedan கார்கள்.",
        },
        catalogUrl: "/vehicles?category=Sedan",
        isActive: true,
        isAvailable: true,
        displayOrder: 1,
      },
      {
        category: "SUV",
        title: { en: "SUV", ta: "SUV" },
        description: {
          en: "Spacious and comfortable SUVs, ideal for family trips, airport transfers, and long-distance outstation journeys.",
          ta: "குடும்ப பயணங்கள், விமான நிலைய போக்குவரத்து மற்றும் நீண்ட தூர வெளியூர் பயணங்களுக்கு ஏற்ற இடமளவுள்ள SUV வாகனங்கள்.",
        },
        catalogUrl: "/vehicles?category=SUV",
        isActive: true,
        isAvailable: true,
        displayOrder: 2,
      },
      {
        category: "Premium SUV",
        title: { en: "Premium SUV", ta: "Premium SUV" },
        description: {
          en: "Travel in style with extra comfort, space, and a more luxurious ride for corporate and family travel.",
          ta: "நிறுவன மற்றும் குடும்ப பயணங்களுக்கு கூடுதல் வசதி, இடவசதி மற்றும் ஆடம்பர பயண அனுபவம்.",
        },
        catalogUrl: "/vehicles?category=Premium%20SUV",
        isActive: true,
        isAvailable: true,
        displayOrder: 3,
      },
      {
        category: "Hatchback",
        title: { en: "Hatchback", ta: "Hatchback" },
        description: {
          en: "Budget-friendly, easy-to-park hatchbacks — a practical choice for city rides and short local trips.",
          ta: "நகர பயணங்கள் மற்றும் குறுகிய உள்ளூர் பயணங்களுக்கு ஏற்ற, மிதமான விலையில் கிடைக்கும் Hatchback கார்கள்.",
        },
        catalogUrl: "/vehicles?category=Hatchback",
        isActive: true,
        isAvailable: true,
        displayOrder: 4,
      },
    ]);
    console.log("[Seed] Default catalog categories created.");
  }

  console.log("[Seed] Done.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[Seed] Failed:", err);
  process.exit(1);
});
