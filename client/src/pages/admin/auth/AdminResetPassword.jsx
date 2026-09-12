import { Helmet } from "react-helmet-async";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, CheckCircle2 } from "lucide-react";
import { useContent } from "../../../context/ContentContext";
import { FormField, TextInput } from "../../../components/FormField";
import { adminPath } from "../../../config/adminPath";
import api from "../../../services/api";
import { apiErrorMessage } from "../../../context/ToastContext";

export default function AdminResetPassword() {
  const { t } = useContent();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const rules = [
    { key: "ruleLength", test: password.length >= 8 },
    { key: "ruleUppercase", test: /[A-Z]/.test(password) },
    { key: "ruleNumber", test: /\d/.test(password) },
    { key: "ruleSpecial", test: /[^A-Za-z0-9]/.test(password) },
  ];

  const submit = async (e) => {
    e.preventDefault();
    if (status.loading) return;

    if (password !== confirm) {
      setStatus({
        loading: false,
        error: t("auth.passwordMismatch") || "Passwords do not match.",
        success: "",
      });
      return;
    }

    if (!rules.every((r) => r.test)) {
      setStatus({
        loading: false,
        error:
          t("auth.passwordRequirementsUnmet") ||
          "Please meet all password requirements.",
        success: "",
      });
      return;
    }

    setStatus({ loading: true, error: "", success: "" });

    try {
      const res = await api.post("/auth/admin/reset-password", {
        email,
        token,
        newPassword: password,
      });

      setStatus({
        loading: false,
        error: "",
        success: res.data?.message || t("auth.resetSuccess"),
      });

      timeoutRef.current = setTimeout(() => {
        navigate(adminPath("/login"));
      }, 1200);
    } catch (err) {
      setStatus({
        loading: false,
        error: apiErrorMessage(err, t("forms.errorGeneric")),
        success: "",
      });
    }
  };

  return (
    <div>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Reset Password — Admin — Shivam Travels</title>
      </Helmet>

      <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-xs">
        <Lock size={22} aria-hidden="true" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
        {t("auth.resetTitle")}
      </h1>
      <p className="text-sm text-gray-500 text-center mt-2 mb-6 leading-relaxed">
        {t("auth.resetSubtitle")}
      </p>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField label={t("auth.newPassword")}>
          <TextInput
            icon={<Lock size={16} />}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required="true"
          />
        </FormField>

        <FormField label={t("auth.reenterPassword")}>
          <TextInput
            icon={<Lock size={16} />}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            aria-required="true"
          />
        </FormField>

        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3.5 text-xs grid grid-cols-2 gap-1.5">
          <p className="col-span-2 font-semibold text-sky-900 mb-1">
            {t("auth.passwordRules")}
          </p>
          {rules.map((r) => (
            <span
              key={r.key}
              className={`flex items-center gap-1 font-medium ${
                r.test ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <CheckCircle2 size={13} aria-hidden="true" />
              <span>{t(`auth.${r.key}`)}</span>
            </span>
          ))}
        </div>

        {status.error && (
          <p
            role="alert"
            className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-lg p-3"
          >
            {status.error}
          </p>
        )}

        {status.success && (
          <p
            role="status"
            className="text-emerald-700 text-sm font-medium bg-emerald-50 border border-emerald-200 rounded-lg p-3"
          >
            {status.success}
          </p>
        )}

        <button
          type="submit"
          disabled={status.loading}
          className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Lock size={16} aria-hidden="true" />
          <span>
            {status.loading
              ? t("auth.resetting") || "Resetting…"
              : t("buttons.resetPassword") || "Reset Password"}
          </span>
        </button>
      </form>

      <Link
        to={adminPath("/login")}
        className="block w-full text-center border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all mt-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
      >
        ← {t("buttons.backToLogin")}
      </Link>
    </div>
  );
}
