import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../services/api";
import {
  FormField,
  TextInput,
  TextArea,
  PrimaryButton,
} from "../../components/FormField";
import ErrorState from "../../components/ErrorState";
import { useToast, apiErrorMessage } from "../../context/ToastContext";
import { useContent } from "../../context/ContentContext";
import { getPageSeoDefaults } from "../../utils/seoDefaults";

const DEFAULT_PAGES = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "services", label: "Services" },
  { key: "vehicles", label: "Vehicles" },
  { key: "booking", label: "Booking" },
  { key: "faq", label: "FAQ" },
  { key: "contact", label: "Contact" },
];

const TITLE_LIMITS = { warn: 60, max: 70 };
const DESCRIPTION_LIMITS = { warn: 160, max: 180 };

const AUTO_FROM_CONTENT = { title: "title", metaDescription: "description" };

const BILINGUAL_FIELDS = [
  {
    key: "title",
    label: "Page Title",
    multiline: false,
    hint: "Shown in browser tabs and search results.",
    counter: TITLE_LIMITS,
  },
  {
    key: "metaDescription",
    label: "Meta Description",
    multiline: true,
    hint: "Shown under the title in search results.",
    counter: DESCRIPTION_LIMITS,
  },
  {
    key: "metaKeywords",
    label: "Meta Keywords",
    multiline: false,
    hint: "Comma-separated. Optional — most search engines ignore this now.",
  },
  {
    key: "ogTitle",
    label: "Open Graph Title",
    multiline: false,
    hint: "Falls back to Page Title if left blank.",
    counter: TITLE_LIMITS,
  },
  {
    key: "ogDescription",
    label: "Open Graph Description",
    multiline: true,
    hint: "Falls back to Meta Description if left blank.",
    counter: DESCRIPTION_LIMITS,
  },
  {
    key: "twitterTitle",
    label: "Twitter/X Title",
    multiline: false,
    hint: "Falls back to Open Graph Title if left blank.",
    counter: TITLE_LIMITS,
  },
  {
    key: "twitterDescription",
    label: "Twitter/X Description",
    multiline: true,
    hint: "Falls back to Open Graph Description if left blank.",
    counter: DESCRIPTION_LIMITS,
  },
];

const URL_FIELDS = [
  {
    key: "ogImage",
    label: "Open Graph Image URL",
    hint: "Falls back to the site logo if left blank.",
  },
  {
    key: "twitterImage",
    label: "Twitter/X Image URL",
    hint: "Falls back to Open Graph Image if left blank.",
  },
  {
    key: "canonicalUrl",
    label: "Canonical URL Override",
    hint: "Leave blank to use the page's real URL automatically.",
  },
];

const emptyBilingual = () => ({ en: "", ta: "" });

function emptyForm() {
  const form = {};
  BILINGUAL_FIELDS.forEach((f) => (form[f.key] = emptyBilingual()));
  URL_FIELDS.forEach((f) => (form[f.key] = ""));
  return form;
}

function CharCounter({ length, limits }) {
  if (!limits) return null;
  const { warn, max } = limits;
  const color =
    length > max
      ? "text-red-600"
      : length > warn
        ? "text-amber-600"
        : "text-gray-400";
  return (
    <span className={`text-xs font-medium tabular-nums ${color}`}>
      {length} / {max}
    </span>
  );
}

export default function AdminSEO() {
  const toast = useToast();
  const { content } = useContent();
  const [pages, setPages] = useState(DEFAULT_PAGES.map((p) => p.key));
  const [activePage, setActivePage] = useState(DEFAULT_PAGES[0].key);
  const [allSettings, setAllSettings] = useState({});
  const [form, setForm] = useState(emptyForm());
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const autoDefaults = getPageSeoDefaults(activePage, content);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    return api
      .get("/seo/settings")
      .then((res) => {
        if (!isMounted.current) return;
        const data = res.data?.data || {};
        setAllSettings(data);
        if (Array.isArray(res.data?.pages) && res.data.pages.length) {
          setPages(res.data.pages);
        }
      })
      .catch((err) => {
        if (isMounted.current)
          setLoadError(apiErrorMessage(err, "Could not load SEO settings."));
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const saved = allSettings[activePage] || {};
    const next = emptyForm();
    BILINGUAL_FIELDS.forEach((f) => {
      next[f.key] = { en: saved[f.key]?.en || "", ta: saved[f.key]?.ta || "" };
    });
    URL_FIELDS.forEach((f) => {
      next[f.key] = saved[f.key] || "";
    });
    setForm(next);
  }, [activePage, allSettings]);

  const updateBilingual = (key, lang, value) => {
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], [lang]: value } }));
  };

  const updateUrl = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await api.put(`/seo/settings/${activePage}`, form);
      if (isMounted.current) {
        setAllSettings((prev) => ({ ...prev, [activePage]: res.data?.data }));
        toast.success("SEO settings saved. Public page updated.");
      }
    } catch (err) {
      if (isMounted.current)
        toast.error(apiErrorMessage(err, "Could not save SEO settings."));
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  const pageLabel = (key) =>
    DEFAULT_PAGES.find((p) => p.key === key)?.label || key;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          SEO Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage search engine and social metadata. Leave fields blank to
          automatically use website content where appropriate.
        </p>
      </div>

      <div className="flex gap-2 my-6 flex-wrap">
        {pages.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActivePage(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 ${
              activePage === key
                ? "bg-red-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {pageLabel(key)}
          </button>
        ))}
      </div>

      {loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-5 max-w-4xl shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="font-bold text-gray-900">
              {pageLabel(activePage)} Page SEO
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="grid sm:grid-cols-2 gap-3 border-b border-gray-50 pb-3"
                >
                  <div className="animate-pulse bg-gray-200 rounded-lg h-9 w-full" />
                  <div className="animate-pulse bg-gray-200 rounded-lg h-9 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {BILINGUAL_FIELDS.map((f) => {
                const enLength = (form[f.key]?.en || "").length;
                const taLength = (form[f.key]?.ta || "").length;
                const autoKey = AUTO_FROM_CONTENT[f.key];
                const showAutoPreview =
                  autoKey && !(form[f.key]?.en || "").trim();
                return (
                  <div
                    key={f.key}
                    className="grid sm:grid-cols-2 gap-3 border-b border-gray-100 pb-4"
                  >
                    <FormField label={`${f.label} (English)`} error={null}>
                      {f.multiline ? (
                        <TextArea
                          value={form[f.key]?.en || ""}
                          onChange={(e) =>
                            updateBilingual(f.key, "en", e.target.value)
                          }
                          placeholder={f.hint}
                        />
                      ) : (
                        <TextInput
                          value={form[f.key]?.en || ""}
                          onChange={(e) =>
                            updateBilingual(f.key, "en", e.target.value)
                          }
                          placeholder={f.hint}
                        />
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs text-gray-400">{f.hint}</span>
                        <CharCounter length={enLength} limits={f.counter} />
                      </div>
                      {showAutoPreview && (
                        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">
                          <span className="font-semibold text-gray-600">
                            Auto — using website content:
                          </span>{" "}
                          {autoDefaults[autoKey]}
                        </p>
                      )}
                    </FormField>
                    <FormField label={`${f.label} (Tamil)`}>
                      {f.multiline ? (
                        <TextArea
                          value={form[f.key]?.ta || ""}
                          onChange={(e) =>
                            updateBilingual(f.key, "ta", e.target.value)
                          }
                          placeholder="தமிழ் உள்ளீடு"
                        />
                      ) : (
                        <TextInput
                          value={form[f.key]?.ta || ""}
                          onChange={(e) =>
                            updateBilingual(f.key, "ta", e.target.value)
                          }
                          placeholder="தமிழ் உள்ளீடு"
                        />
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs text-gray-400">
                          Optional — falls back to English if left blank.
                        </span>
                        <CharCounter length={taLength} limits={f.counter} />
                      </div>
                    </FormField>
                  </div>
                );
              })}

              {URL_FIELDS.map((f) => (
                <FormField key={f.key} label={f.label}>
                  <TextInput
                    type="url"
                    value={form[f.key] || ""}
                    onChange={(e) => updateUrl(f.key, e.target.value)}
                    placeholder={f.hint}
                  />
                </FormField>
              ))}

              <div className="flex items-center gap-3 pt-2">
                <PrimaryButton
                  type="button"
                  onClick={save}
                  loading={saving}
                  className="max-w-xs"
                >
                  Save {pageLabel(activePage)} SEO
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
