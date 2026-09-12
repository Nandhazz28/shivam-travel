import { Helmet } from "react-helmet-async";
import { useLanguage, pick } from "../context/LanguageContext";
import { useSEOSettings } from "../context/SEOSettingsContext";

function isUsableSiteUrl(value) {
  if (!value) return false;
  if (import.meta.env.PROD && /localhost|127\.0\.0\.1/i.test(value))
    return false;
  return true;
}

const configuredSiteUrl = import.meta.env.VITE_SITE_URL;
const SITE_URL = (
  isUsableSiteUrl(configuredSiteUrl)
    ? configuredSiteUrl
    : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:5173"
).replace(/\/$/, "");

const DEFAULT_OG_IMAGE = `${SITE_URL}/images/logo.webp`;

function overrideText(bilingualField, language) {
  const value = pick(bilingualField, language);
  return value && value.trim() ? value.trim() : undefined;
}

export default function SEO({
  title,
  description,
  path = "/",
  image,
  noindex = false,
  jsonLd,
  page,
}) {
  const { language } = useLanguage();
  const { settings } = useSEOSettings();
  const override = page ? settings[page] : null;

  const rawPath = path.startsWith("/") ? path : `/${path}`;
  const rawCanonical =
    override?.canonicalUrl?.trim() || `${SITE_URL}${rawPath}`;
  const canonical =
    rawCanonical === SITE_URL ? SITE_URL : rawCanonical.replace(/\/$/, "");

  const resolvedTitle =
    (override && overrideText(override.title, language)) || title;
  const resolvedDescription =
    (override && overrideText(override.metaDescription, language)) ||
    description;
  const resolvedKeywords =
    override && overrideText(override.metaKeywords, language);
  const ogTitle =
    (override && overrideText(override.ogTitle, language)) || resolvedTitle;
  const ogDescription =
    (override && overrideText(override.ogDescription, language)) ||
    resolvedDescription;
  const ogImage = override?.ogImage?.trim() || image || DEFAULT_OG_IMAGE;
  const twitterTitle =
    (override && overrideText(override.twitterTitle, language)) || ogTitle;
  const twitterDescription =
    (override && overrideText(override.twitterDescription, language)) ||
    ogDescription;
  const twitterImage = override?.twitterImage?.trim() || ogImage;

  return (
    <Helmet>
      <html lang={language} />
      {resolvedTitle && <title>{resolvedTitle}</title>}
      {resolvedDescription && (
        <meta name="description" content={resolvedDescription} />
      )}
      {resolvedKeywords && <meta name="keywords" content={resolvedKeywords} />}
      <link rel="canonical" href={canonical} />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Shivam Travels" />
      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDescription && (
        <meta property="og:description" content={ogDescription} />
      )}
      <meta property="og:url" content={canonical} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta
        property="og:locale"
        content={language === "ta" ? "ta_IN" : "en_IN"}
      />

      <meta name="twitter:card" content="summary_large_image" />
      {twitterTitle && <meta name="twitter:title" content={twitterTitle} />}
      {twitterDescription && (
        <meta name="twitter:description" content={twitterDescription} />
      )}
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
