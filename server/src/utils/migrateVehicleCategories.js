import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Vehicle, { VEHICLE_CATEGORIES } from "../models/Vehicle.js";

const LEGACY_CATEGORY_MAP = {
  MPV: "SUV",
  Tempo: "Premium SUV",
  "Tempo Traveller": "Premium SUV",
  Bus: "Premium SUV",
};

async function run() {
  const apply = process.argv.includes("--apply");

  await connectDB();

  const vehicles = await Vehicle.collection.find({}).toArray();
  const invalid = vehicles.filter(
    (v) => !VEHICLE_CATEGORIES.includes(v.category),
  );

  if (invalid.length === 0) {
    console.log(
      "[Migrate] No vehicles with unsupported categories found. Nothing to do.",
    );
    await mongoose.connection.close();
    process.exit(0);
  }

  console.log(
    `[Migrate] Found ${invalid.length} vehicle(s) with unsupported categories:`,
  );

  const toUpdate = [];
  const needsManualReview = [];

  for (const v of invalid) {
    const mapped = LEGACY_CATEGORY_MAP[v.category];
    console.log(
      `  - ${v._id} "${v.name?.en || v.slug || "Unnamed"}": category="${v.category}" -> ${
        mapped ? `will map to "${mapped}"` : "NO MAPPING (needs manual review)"
      }`,
    );
    if (mapped) {
      toUpdate.push({ id: v._id, from: v.category, to: mapped });
    } else {
      needsManualReview.push(v);
    }
  }

  if (!apply) {
    console.log(
      "\n[Migrate] Dry run only — no documents were changed. Re-run with --apply to update them.",
    );
    await mongoose.connection.close();
    process.exit(0);
  }

  for (const { id, to } of toUpdate) {
    await Vehicle.collection.updateOne({ _id: id }, { $set: { category: to } });
  }

  console.log(`\n[Migrate] Updated ${toUpdate.length} vehicle(s).`);
  if (needsManualReview.length > 0) {
    console.log(
      `[Migrate] ${needsManualReview.length} vehicle(s) had no mapping and were left unchanged — update them manually in the admin panel.`,
    );
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("[Migrate] Failed:", err);
  process.exit(1);
});
