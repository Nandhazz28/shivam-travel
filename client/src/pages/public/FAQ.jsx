import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import { useContent } from "../../context/ContentContext";
import { useLanguage, pick } from "../../context/LanguageContext";
import SEO from "../../components/SEO";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Reveal from "../../components/Reveal";
import { SkeletonCard } from "../../components/Skeleton";
import { breadcrumbJsonLd, faqJsonLd } from "../../utils/jsonLd";
import { getPageSeoDefaults } from "../../utils/seoDefaults";
import api from "../../services/api";

function AccordionItem({ faq, language, isOpen, onToggle }) {
  const question = pick(faq.question, language);
  const answer = pick(faq.answer, language);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-4 sm:py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red"
      >
        <span className="font-bold text-sm sm:text-base text-slate-900">
          {question}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-brand-red transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 sm:px-6 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const { t, content } = useContent();
  const { language } = useLanguage();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return api
      .get("/faqs")
      .then((res) => {
        const list = res.data?.data || [];
        setFaqs(list);
        if (list.length > 0) setOpenId(list[0]._id);
      })
      .catch(() => setError("Could not load our FAQs right now."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const seoDefaults = getPageSeoDefaults("faq", content);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      <SEO
        page="faq"
        title={seoDefaults.title}
        description={seoDefaults.description}
        path="/faq"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: t("faq.title"), path: "/faq" },
          ]),
          faqJsonLd(faqs, language),
        ]}
      />

      <div className="text-center max-w-xl mx-auto mb-10">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-red mb-1">
          {t("faq.eyebrow")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t("faq.title")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed">
          {t("faq.subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} lines={1} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : faqs.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title={t("faq.emptyTitle")}
          message={t("faq.emptyMessage")}
        />
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <Reveal key={faq._id} stagger={idx % 8}>
              <AccordionItem
                faq={faq}
                language={language}
                isOpen={openId === faq._id}
                onToggle={() =>
                  setOpenId((prev) => (prev === faq._id ? null : faq._id))
                }
              />
            </Reveal>
          ))}
        </div>
      )}

      <div className="mt-10 bg-slate-50/80 border border-dashed border-slate-200/80 rounded-2xl p-6 sm:p-8 text-center">
        <p className="font-bold text-slate-900 text-sm sm:text-base">
          {t("faq.stillHaveQuestions")}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 mb-4">
          {t("faq.contactPrompt")}
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 bg-brand-red text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 active:scale-[0.99] transition duration-150"
        >
          <MessageCircle size={16} aria-hidden="true" />
          {t("navigation.contact")}
        </Link>
      </div>
    </div>
  );
}
