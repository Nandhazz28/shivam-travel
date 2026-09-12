import { Helmet } from "react-helmet-async";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Send } from "lucide-react";
import { useContent } from "../../../context/ContentContext";
import { FormField, TextInput } from "../../../components/FormField";
import { adminPath } from "../../../config/adminPath";
import api from "../../../services/api";
import { apiErrorMessage } from "../../../context/ToastContext";

export default function AdminForgotPassword() {
  const { t } = useContent();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
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

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus({
        loading: false,
        error: t("auth.emailRequired") || "Email is required.",
        success: "",
      });
      return;
    }

    setStatus({ loading: true, error: "", success: "" });
    try {
      const res = await api.post("/auth/admin/forgot-password", { email });
      setStatus({
        loading: false,
        error: "",
        success: res.data?.message || t("auth.otpSentSuccess"),
      });

      timeoutRef.current = setTimeout(() => {
        navigate(
          `${adminPath("/verify-otp")}?email=${encodeURIComponent(email)}`,
        );
      }, 1000);
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
        <title>Forgot Password — Admin — Shivam Travels</title>
      </Helmet>

      <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-xs">
        <Lock size={22} aria-hidden="true" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
        {t("auth.forgotTitle")}
      </h1>
      <p className="text-sm text-gray-500 text-center mt-2 mb-6 leading-relaxed">
        {t("auth.forgotSubtitle")}
      </p>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField label={t("auth.emailAddress")}>
          <TextInput
            icon={<Mail size={16} />}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            autoComplete="email"
          />
        </FormField>

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
          <Send size={16} aria-hidden="true" />
          <span>
            {status.loading
              ? t("auth.sending") || "Sending…"
              : t("buttons.sendResetLink") || "Send Reset Link"}
          </span>
        </button>
      </form>

      <Link
        to={adminPath("/login")}
        className="block w-full text-center border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all mt-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
      >
        ← {t("buttons.backToLogin")}
      </Link>
    </div>
  );
}
