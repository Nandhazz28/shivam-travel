import mongoose from "mongoose";
import { bilingualField } from "./shared/bilingual.js";

export const SEO_PAGES = [
  "home",
  "about",
  "services",
  "vehicles",
  "booking",
  "faq",
  "contact",
];

const pageSEOSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, unique: true, enum: SEO_PAGES },
    title: bilingualField(),
    metaDescription: bilingualField(),
    metaKeywords: bilingualField(),
    ogTitle: bilingualField(),
    ogDescription: bilingualField(),
    ogImage: { type: String, default: "", trim: true },
    canonicalUrl: { type: String, default: "", trim: true },
    twitterTitle: bilingualField(),
    twitterDescription: bilingualField(),
    twitterImage: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

pageSEOSchema.statics.getAllAsMap = async function getAllAsMap() {
  const docs = await this.find();
  const byPage = Object.fromEntries(docs.map((d) => [d.page, d]));
  const map = {};
  for (const page of SEO_PAGES) {
    map[page] = byPage[page] || { page };
  }
  return map;
};

pageSEOSchema.statics.upsertForPage = async function upsertForPage(page, data) {
  return this.findOneAndUpdate(
    { page },
    { $set: { page, ...data } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

export default mongoose.model("PageSEO", pageSEOSchema);
