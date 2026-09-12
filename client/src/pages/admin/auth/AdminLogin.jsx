import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useContent } from "../../../context/ContentContext";
import { FormField, TextInput } from "../../../components/FormField";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { apiErrorMessage } from "../../../context/ToastContext";
import { adminPath } from "../../../config/adminPath";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLogin() {
  const { t } = useContent();
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, error: "" });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const validate = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = t("forms.emailRequired") || "Email is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = t("forms.emailInvalid") || "Enter a valid email address.";
    }

    if (!password) {
      errors.password = t("forms.passwordRequired") || "Password is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (status.loading) return;
    if (!validate()) return;

    setStatus({ loading: true, error: "" });
    try {
      await login(email.trim(), password);
      if (isMounted.current) {
        navigate(adminPath("/dashboard"));
      }
    } catch (err) {
      if (isMounted.current) {
        setStatus({
          loading: false,
          error: apiErrorMessage(
            err,
            t("forms.errorGeneric") || "Could not log in.",
          ),
        });
      }
    }
  };

  return (
    <div>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Admin Login — Shivam Travels</title>
      </Helmet>

      <div
        className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 border border-red-100 shadow-xs"
        aria-hidden="true"
      >
        <ShieldCheck size={24} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
        {t("auth.adminLogin")}
      </h1>
      <p className="text-sm text-gray-500 text-center mt-1.5 mb-7">
        {t("auth.loginSubtitle")}
      </p>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField label={t("auth.emailAddress")} error={fieldErrors.email}>
          <TextInput
            icon={<Mail size={16} />}
            type="email"
            autoComplete="username"
            placeholder="you@shivamtravels.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email)
                setFieldErrors((f) => ({ ...f, email: undefined }));
            }}
            required
            aria-required="true"
            aria-invalid={!!fieldErrors.email}
          />
        </FormField>

        <FormField label={t("auth.password")} error={fieldErrors.password}>
          <TextInput
            icon={<Lock size={16} />}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            required
            aria-required="true"
            aria-invalid={!!fieldErrors.password}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="p-1 -m-1 text-gray-400 hover:text-gray-600 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                aria-label={
                  showPassword
                    ? t("auth.hidePassword") || "Hide password"
                    : t("auth.showPassword") || "Show password"
                }
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </FormField>

        <div className="text-right -mt-1">
          <Link
            to={adminPath("/forgot-password")}
            className="text-sm text-red-600 font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 rounded px-1 py-0.5"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>

        {status.error && (
          <p
            role="alert"
            className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 font-medium"
          >
            {status.error}
          </p>
        )}

        <button
          type="submit"
          disabled={status.loading}
          className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {status.loading
            ? t("auth.signingIn") || "Signing in…"
            : t("buttons.login") || "Log in"}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-7 leading-relaxed">
        {t("auth.staffNotice") ||
          "Staff and administrator access only. Contact your manager if you need an account."}
      </p>
    </div>
  );
}
