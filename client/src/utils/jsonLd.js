function isUsableSiteUrl(value) {
  if (!value) return false;
  if (import.meta.env.PROD && /localhost|127\.0\.0\.1/i.test(value))
    return false;
  return true;
}

const configuredSiteUrl = import.meta.env.VITE_SITE_URL;
const SITE_URL = isUsableSiteUrl(configuredSiteUrl)
  ? configuredSiteUrl
  : typeof window !== "undefined"
    ? window.location.origin
    : "https://localhost:5173";

export function organizationJsonLd(settings = {}) {
  const node = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: settings.businessName || "Shivam Travels",
    url: SITE_URL,
    image: `${SITE_URL}/images/logo.webp`,
    logo: `${SITE_URL}/images/logo.webp`,
    areaServed: "Mayiladuthurai, Tamil Nadu, India",
  };
  if (settings.phone) node.telephone = settings.phone;
  if (settings.email) node.email = settings.email;
  if (settings.address?.en) {
    node.address = {
      "@type": "PostalAddress",
      streetAddress: settings.address.en,
      addressLocality: "Mayiladuthurai",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    };
  }
  const sameAs = [
    settings.socialLinks?.facebook,
    settings.socialLinks?.instagram,
    settings.socialLinks?.youtube,
  ].filter(Boolean);
  if (sameAs.length) node.sameAs = sameAs;
  return node;
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Shivam Travels",
    url: SITE_URL,
  };
}

export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function vehicleListJsonLd(vehicles = [], language = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: vehicles.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/vehicles/${v.slug}`,
      name: v.name?.[language] || v.name?.en,
    })),
  };
}

export function serviceJsonLd(service, language = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.name?.[language] || service.name?.en,
    provider: { "@type": "TravelAgency", name: "Shivam Travels" },
    areaServed: "Mayiladuthurai, Tamil Nadu, India",
    description: service.description?.[language] || service.description?.en,
  };
}

export function faqJsonLd(faqs = [], language = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question?.[language] || f.question?.en,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer?.[language] || f.answer?.en,
      },
    })),
  };
}
