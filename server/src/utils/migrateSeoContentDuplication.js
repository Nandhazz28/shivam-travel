import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import WebsiteContent from "../models/WebsiteContent.js";
import PageSEO from "../models/PageSEO.js";

async function run() {
  const apply = process.argv.includes("--apply");

  await connectDB();

  const legacy = await WebsiteContent.findOne({ section: "seo" });

  if (!legacy) {
    console.log(
      '[Migrate] No legacy "seo" Website Content section found. Nothing to do.',
    );
    await mongoose.connection.close();
    process.exit(0);
  }

  const legacyTitle =
    typeof legacy.content?.homeTitle === "string"
      ? legacy.content.homeTitle.trim()
      : "";
  const legacyDescription =
    typeof legacy.content?.homeDescription === "string"
      ? legacy.content.homeDescription.trim()
      : "";

  console.log('[Migrate] Found legacy "seo" Website Content section:');
  console.log(`  - homeTitle: ${legacyTitle || "(empty)"}`);
  console.log(`  - homeDescription: ${legacyDescription || "(empty)"}`);

  const homeSeo = await PageSEO.findOne({ page: "home" });
  const updates = {};

  if (legacyTitle && !homeSeo?.title?.en) {
    updates.title = { en: legacyTitle, ta: homeSeo?.title?.ta || "" };
    console.log("  -> will copy into PageSEO(home).title.en (currently empty)");
  } else if (legacyTitle) {
    console.log(
      "  -> PageSEO(home).title.en is already set — leaving it untouched, discarding legacy duplicate",
    );
  }

  if (legacyDescription && !homeSeo?.metaDescription?.en) {
    updates.metaDescription = {
      en: legacyDescription,
      ta: homeSeo?.metaDescription?.ta || "",
    };
    console.log(
      "  -> will copy into PageSEO(home).metaDescription.en (currently empty)",
    );
  } else if (legacyDescription) {
    console.log(
      "  -> PageSEO(home).metaDescription.en is already set — leaving it untouched, discarding legacy duplicate",
    );
  }

  if (!apply) {
    console.log(
      "\n[Migrate] Dry run only — no documents were changed. Re-run with --apply to migrate + clean up.",
    );
    await mongoose.connection.close();
    process.exit(0);
  }

  if (Object.keys(updates).length > 0) {
    await PageSEO.upsertForPage("home", updates);
    console.log("[Migrate] Copied legacy value(s) into PageSEO(home).");
  }

  await WebsiteContent.deleteOne({ section: "seo" });
  console.log('[Migrate] Removed the obsolete "seo" Website Content section.');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("[Migrate] Failed:", err);
  process.exit(1);
});
