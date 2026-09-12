import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import enDefault from "../../content/en.json";
import {
  FormField,
  TextInput,
  PrimaryButton,
} from "../../components/FormField";
import ConfirmModal, { useConfirm } from "../../components/ConfirmModal";
import { useToast, apiErrorMessage } from "../../context/ToastContext";

function flatten(obj, prefix = "") {
  let out = {};
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      out = { ...out, ...flatten(obj[key], path) };
    } else {
      out[path] = obj[key];
    }
  }
  return out;
}

function unflatten(flat) {
  const result = {};
  for (const path of Object.keys(flat)) {
    const keys = path.split(".");
    let obj = result;
    keys.forEach((key, i) => {
      if (i === keys.length - 1) {
        obj[key] = flat[path];
      } else {
        obj[key] = obj[key] || {};
        obj = obj[key];
      }
    });
  }
  return result;
}

function flattenBilingual(obj, prefix = "") {
  let out = {};
  for (const key of Object.keys(obj || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (
      val &&
      typeof val === "object" &&
      (typeof val.en === "string" || typeof val.ta === "string")
    ) {
      out[path] = val;
    } else if (val && typeof val === "object") {
      out = { ...out, ...flattenBilingual(val, path) };
    }
  }
  return out;
}

const SECTIONS = Object.keys(enDefault);

export default function AdminContent() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);
  const [fieldsEn, setFieldsEn] = useState({});
  const [fieldsTa, setFieldsTa] = useState({});
  const [saving, setSaving] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setSectionLoading(true);
    setSearchQuery("");
    const defaultsEn = flatten(enDefault[activeSection] || {});

    api
      .get(`/content/${activeSection}`)
      .then((res) => {
        if (!isMounted.current) return;
        const dbContent = res.data?.data || {};
        const flatDb = flattenBilingual(dbContent);
        const en = { ...defaultsEn };
        const ta = {};

        Object.keys(defaultsEn).forEach((path) => {
          if (flatDb[path]?.en !== undefined) en[path] = flatDb[path].en;
          ta[path] = flatDb[path]?.ta || "";
        });

        setFieldsEn(en);
        setFieldsTa(ta);
      })
      .catch(() => {
        if (!isMounted.current) return;
        setFieldsEn(defaultsEn);
        setFieldsTa({});
      })
      .finally(() => {
        if (isMounted.current) setSectionLoading(false);
      });
  }, [activeSection]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const bilingualFlat = {};
    Object.keys(fieldsEn).forEach((path) => {
      bilingualFlat[path] = { en: fieldsEn[path], ta: fieldsTa[path] || "" };
    });
    const content = unflatten(bilingualFlat);

    try {
      await api.put(`/content/${activeSection}`, { content });
      if (isMounted.current) {
        toast.success("Content saved. Public site updated.");
      }
    } catch (err) {
      if (isMounted.current) {
        toast.error(apiErrorMessage(err, "Could not save content."));
      }
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  const restoreDefault = () => {
    confirmDialog.ask({
      title: "Restore default text?",
      message:
        "This removes saved edits for this section and restores default strings.",
      confirmLabel: "Restore",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/content/${activeSection}`);
          if (isMounted.current) {
            setFieldsEn(flatten(enDefault[activeSection] || {}));
            setFieldsTa({});
            toast.success("Section restored to default.");
          }
        } catch (err) {
          if (isMounted.current) {
            toast.error(
              apiErrorMessage(err, "Could not restore default content."),
            );
          }
        }
      },
    });
  };

  const filteredPaths = Object.keys(fieldsEn).filter(
    (path) =>
      path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fieldsEn[path] &&
        fieldsEn[path].toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
        Website Content
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Manage the text displayed on the public website. Changes update the
        database and display immediately. Search-engine metadata (page
        titles, meta descriptions) lives in SEO Management instead.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveSection(s)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 ${
              activeSection === s
                ? "bg-red-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-3xl shadow-sm">
        <div className="flex justify-between items-center gap-4 border-b border-gray-100 pb-3">
          <h2 className="font-bold text-gray-800 capitalize">
            {activeSection} Keys
          </h2>
          <TextInput
            placeholder="Filter keys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs text-sm"
          />
        </div>

        {sectionLoading ? (
          <div className="space-y-4" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid sm:grid-cols-2 gap-3 border-b border-gray-50 pb-3"
              >
                <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-full" />
                <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredPaths.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No content keys match your search filter.
          </p>
        ) : (
          filteredPaths.map((path) => (
            <div
              key={path}
              className="grid sm:grid-cols-2 gap-3 border-b border-gray-50 pb-3"
            >
              <FormField label={`${path} (English)`}>
                <TextInput
                  value={fieldsEn[path] || ""}
                  onChange={(e) =>
                    setFieldsEn((f) => ({ ...f, [path]: e.target.value }))
                  }
                />
              </FormField>
              <FormField label={`${path} (Tamil)`}>
                <TextInput
                  value={fieldsTa[path] || ""}
                  onChange={(e) =>
                    setFieldsTa((f) => ({ ...f, [path]: e.target.value }))
                  }
                />
              </FormField>
            </div>
          ))
        )}

        <div className="flex items-center gap-3 pt-2">
          <PrimaryButton
            type="button"
            onClick={save}
            loading={saving}
            disabled={sectionLoading}
            className="max-w-xs"
          >
            Save Section
          </PrimaryButton>
          <button
            type="button"
            onClick={restoreDefault}
            disabled={sectionLoading || saving}
            className="text-sm text-gray-500 underline disabled:opacity-40 hover:text-red-600 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 rounded"
          >
            Restore default
          </button>
        </div>
      </div>

      <ConfirmModal {...confirmDialog.props} />
    </div>
  );
}
