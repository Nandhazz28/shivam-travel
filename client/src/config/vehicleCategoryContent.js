const CATEGORY_CONTENT = {
  Hatchback: {
    en: {
      heading: "Compact Hatchback Cars for City Travel",
      description:
        "Our compact hatchbacks are a practical, budget-friendly choice for city rides, short local trips, and airport transfers.",
      highlights: [
        "Budget-friendly city travel",
        "Easy to park and maneuver",
        "Local trips",
        "Airport transfers",
      ],
    },
    ta: {
      heading: "நகர பயணத்திற்கான Hatchback கார்கள்",
      description:
        "எங்கள் Hatchback கார்கள் நகர பயணங்கள், குறுகிய உள்ளூர் பயணங்கள் மற்றும் விமான நிலைய போக்குவரத்திற்கு ஏற்ற, மிதமான விலையில் கிடைக்கும் தேர்வாகும்.",
      highlights: [
        "மிதமான விலையில் நகர பயணம்",
        "எளிதாக பார்க் செய்யக்கூடியது",
        "உள்ளூர் பயணங்கள்",
        "விமான நிலைய போக்குவரத்து",
      ],
    },
  },

  SUV: {
    en: {
      heading: "Premium SUV Vehicles for Comfortable Travel",
      description:
        "Enjoy comfortable and spacious travel with our premium SUV vehicles, ideal for family trips, airport transfers, business travel, and long-distance outstation journeys.",
      highlights: [
        "Spacious and comfortable travel",
        "Family and group trips",
        "Airport transfers",
        "Outstation travel",
      ],
    },
    ta: {
      heading: "வசதியான பயணத்திற்கான பிரீமியம் SUV வாகனங்கள்",
      description:
        "எங்கள் பிரீமியம் SUV வாகனங்களில் வசதியான, இடமளவுள்ள பயணத்தை அனுபவிக்கவும் — குடும்ப பயணங்கள், விமான நிலைய போக்குவரத்து, வணிக பயணம் மற்றும் நீண்ட தூர வெளியூர் பயணங்களுக்கு ஏற்றது.",
      highlights: [
        "இடமளவுள்ள, வசதியான பயணம்",
        "குடும்ப மற்றும் குழு பயணங்கள்",
        "விமான நிலைய போக்குவரத்து",
        "வெளியூர் பயணம்",
      ],
    },
  },

  "Premium SUV": {
    en: {
      heading: "Premium SUV Vehicles for Luxury Travel",
      description:
        "Travel in style with our premium SUVs, offering extra comfort, space, and a more luxurious ride for family trips, corporate travel, and long-distance outstation journeys.",
      highlights: [
        "Extra comfort and space",
        "Premium ride experience",
        "Corporate and family travel",
        "Long-distance outstation trips",
      ],
    },
    ta: {
      heading: "ஆடம்பர பயணத்திற்கான Premium SUV வாகனங்கள்",
      description:
        "எங்கள் Premium SUV வாகனங்களில் கூடுதல் வசதி, இடவசதி மற்றும் ஆடம்பரமான பயணத்தை அனுபவிக்கவும் — குடும்ப பயணங்கள், நிறுவன பயணம் மற்றும் நீண்ட தூர வெளியூர் பயணங்களுக்கு ஏற்றது.",
      highlights: [
        "கூடுதல் வசதி மற்றும் இடவசதி",
        "ஆடம்பர பயண அனுபவம்",
        "நிறுவன மற்றும் குடும்ப பயணம்",
        "நீண்ட தூர வெளியூர் பயணங்கள்",
      ],
    },
  },

  Sedan: {
    en: {
      heading: "Comfortable Sedan Cars for City and Outstation Travel",
      description:
        "Our comfortable sedan cars are suitable for city travel, airport transfers, business trips, family journeys, and convenient outstation travel.",
      highlights: [
        "Comfortable city travel",
        "Airport transfers",
        "Business trips",
        "Outstation journeys",
      ],
    },
    ta: {
      heading: "நகர மற்றும் வெளியூர் பயணத்திற்கான வசதியான Sedan கார்கள்",
      description:
        "எங்கள் வசதியான Sedan கார்கள் நகர பயணம், விமான நிலைய போக்குவரத்து, வணிக பயணங்கள், குடும்ப பயணங்கள் மற்றும் வசதியான வெளியூர் பயணத்திற்கு ஏற்றவை.",
      highlights: [
        "வசதியான நகர பயணம்",
        "விமான நிலைய போக்குவரத்து",
        "வணிக பயணங்கள்",
        "வெளியூர் பயணங்கள்",
      ],
    },
  },

};

const CATEGORY_ALIASES = {
  hatchback: "Hatchback",
  "mini suv": "SUV",
  "compact suv": "SUV",
  suv: "SUV",
  "premium suv": "Premium SUV",
  "luxury suv": "Premium SUV",
  sedan: "Sedan",
  saloon: "Sedan",
};

const DEFAULT_CATEGORY = "Sedan";

// Only Hatchback, Sedan, SUV and Premium SUV are supported. Any unrecognized value (e.g. a
// stale category from data created before this restriction was enforced) falls back to the
// default category's content rather than a fake "Other" bucket.
export function normalizeCategory(rawCategory) {
  if (!rawCategory || typeof rawCategory !== "string") return DEFAULT_CATEGORY;
  const trimmed = rawCategory.trim();
  if (CATEGORY_CONTENT[trimmed]) return trimmed;
  const alias = CATEGORY_ALIASES[trimmed.toLowerCase()];
  return alias && CATEGORY_CONTENT[alias] ? alias : DEFAULT_CATEGORY;
}

export function getCategoryContent(rawCategory, language = "en") {
  const key = normalizeCategory(rawCategory);
  const entry = CATEGORY_CONTENT[key];
  return entry[language] || entry.en;
}

export default CATEGORY_CONTENT;
