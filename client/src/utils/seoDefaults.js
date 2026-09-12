const BRAND = "Shivam Travels";
const AREA = "Mayiladuthurai";

function safeGet(obj, path) {
  return path
    .split(".")
    .reduce(
      (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
      obj,
    );
}

function truncate(value, max) {
  if (!value) return value;
  const trimmed = String(value).trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export const SEO_PAGE_KEYS = [
  "home",
  "about",
  "services",
  "vehicles",
  "booking",
  "faq",
  "contact",
];

export function getPageSeoDefaults(pageKey, content) {
  switch (pageKey) {
    case "home": {
      const subtitle = safeGet(content, "home.hero.subtitle");
      const description = safeGet(content, "home.hero.description");
      return {
        title: subtitle
          ? `${BRAND} — ${subtitle}`
          : `${BRAND} — Car with Driver in ${AREA}`,
        description:
          truncate(description, 160) ||
          `Safe, reliable car with driver service from ${BRAND} in ${AREA}. Outstation trips, airport transfers and local travel.`,
      };
    }
    case "about": {
      const description = safeGet(content, "about.description");
      return {
        title: `About ${BRAND} — Car with Driver in ${AREA}`,
        description:
          truncate(description, 160) ||
          `Learn about ${BRAND}, a trusted car-with-driver travel service based in ${AREA}.`,
      };
    }
    case "services": {
      return {
        title: `Our Services — Outstation Trips, Airport Transfers & More | ${BRAND}`,
        description: `Outstation trips, airport transfers, corporate travel, one-day tours and family trips with professional drivers — ${BRAND}, ${AREA}.`,
      };
    }
    case "vehicles": {
      const eyebrow = safeGet(content, "vehicles.eyebrow");
      const subtitle = safeGet(content, "vehicles.subtitle");
      return {
        title: eyebrow ? `${eyebrow} — ${BRAND}` : `Our Vehicles — ${BRAND}`,
        description:
          truncate(subtitle, 160) ||
          `Browse ${BRAND}'s fleet of hatchbacks, sedans, SUVs and premium SUVs with driver in ${AREA}.`,
      };
    }
    case "booking": {
      const subtitle = safeGet(content, "booking.sectionSubtitle");
      return {
        title: `Book Your Ride — ${BRAND} ${AREA}`,
        description: subtitle
          ? truncate(`${subtitle} Car with driver bookings in ${AREA}.`, 160)
          : `Book a car with driver from ${BRAND} for outstation trips, local travel and airport transfers in ${AREA}.`,
      };
    }
    case "faq": {
      const title = safeGet(content, "faq.title");
      const subtitle = safeGet(content, "faq.subtitle");
      return {
        title: title ? `${title} — ${BRAND}` : `FAQ — ${BRAND}`,
        description:
          truncate(subtitle, 160) ||
          `Answers to common questions about booking, pricing and travel with ${BRAND}.`,
      };
    }
    case "contact": {
      const subtitle = safeGet(content, "contact.subtitle");
      return {
        title: `Contact ${BRAND} — ${AREA}`,
        description: subtitle
          ? truncate(`Contact ${BRAND} in ${AREA}. ${subtitle}`, 160)
          : `Get in touch with ${BRAND} for car-with-driver bookings and enquiries in ${AREA}.`,
      };
    }
    default:
      return {
        title: BRAND,
        description: `${BRAND} — car with driver travel services in ${AREA}.`,
      };
  }
}
