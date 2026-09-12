import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import BusinessSettings from "../models/BusinessSettings.js";

const OLD_FAKE_DEFAULTS = {
  happyCustomers: 1000,
  successfulTrips: 5000,
  yearsExperience: 5,
  outstationDestinations: 10,
};

async function run() {
  const apply = process.argv.includes("--apply");

  await connectDB();

  const settings = await BusinessSettings.findOne();

  if (!settings) {
    console.log("[Migrate] No BusinessSettings document found. Nothing to do.");
    await mongoose.connection.close();
    process.exit(0);
  }

  const updates = {};
  for (const [key, oldDefault] of Object.entries(OLD_FAKE_DEFAULTS)) {
    const current = settings.stats?.[key];
    if (current === oldDefault) {
      updates[`stats.${key}`] = 0;
      console.log(
        `  - stats.${key} is still the old fabricated default (${oldDefault}) -> will reset to 0`,
      );
    }
  }

  if (Object.keys(updates).length === 0) {
    console.log(
      "[Migrate] No stats fields match the old fabricated defaults. Nothing to do.",
    );
    await mongoose.connection.close();
    process.exit(0);
  }

  if (!apply) {
    console.log(
      "\n[Migrate] Dry run only — no documents were changed. Re-run with --apply to reset these fields.",
    );
    await mongoose.connection.close();
    process.exit(0);
  }

  await BusinessSettings.updateOne({ _id: settings._id }, { $set: updates });
  console.log(
    "[Migrate] Reset the matched fields to 0. Enter real figures in Admin → Settings to publish them again.",
  );

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("[Migrate] Failed:", err);
  process.exit(1);
});
