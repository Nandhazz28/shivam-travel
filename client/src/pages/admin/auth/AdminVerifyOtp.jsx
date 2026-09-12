import { Helmet } from "react-helmet-async";
import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import { useContent } from "../../../context/ContentContext";
import { adminPath } from "../../../config/adminPath";
import api from "../../../services/api";
import { apiErrorMessage } from "../../../context/ToastContext";

const OTP_TTL_SECONDS = 600;
const RESEND_COOLDOWN_SECONDS = 60;

export default function AdminVerifyOtp() {
  const { t } = useContent();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";

  const [digits, setDigits] = useState(Array(6).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });
  const refs = useRef([]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (!digits[i] && i > 0) {
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasted)) return;

    const next = pasted.split("");
    setDigits(next);
    refs.current[5]?.focus();
  };

  const verify = useCallback(
    async (e) => {
      e?.preventDefault();
      const otp = digits.join("");

      if (otp.length !== 6) {
        setStatus({
          loading: false,
          error: t("auth.otpIncomplete") || "Please enter the full 6-digit code.",
          success: "",
        });
        return;
      }
      if (secondsLeft === 0) {
        setStatus({
          loading: false,
          error:
            t("auth.otpExpired") ||
            "This code has expired. Please request a new one.",
          success: "",
        });
        return;
      }

      setStatus({ loading: true, error: "", success: "" });
      try {
        const res = await api.post("/auth/admin/verify-otp", { email, otp });

        const token = res.data?.resetToken
          ? `&token=${encodeURIComponent(res.data.resetToken)}`
          : "";
        navigate(
          `${adminPath("/reset-password")}?email=${encodeURIComponent(email)}${token}`,
        );
      } catch (err) {
        setStatus({
          loading: false,
          error: apiErrorMessage(err, t("forms.errorGeneric")),
          success: "",
        });
      }
    },
    [digits, email, secondsLeft, navigate, t],
  );

  const resend = async () => {
    if (resendCooldown > 0) return;
    setStatus({ loading: false, error: "", success: "" });
    try {
      await api.post("/auth/admin/resend-otp", { email });
      setSecondsLeft(OTP_TTL_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(6).fill(""));
      setStatus({
        loading: false,
        error: "",
        success: t("auth.otpResentSuccess") || "A new code has been sent.",
      });
      refs.current[0]?.focus();
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
        <title>Verify Code — Admin — Shivam Travels</title>
      </Helmet>

      <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 border border-red-100 shadow-xs">
        <Mail size={24} aria-hidden="true" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
        {t("auth.otpTitle")}
      </h1>
      <p className="text-sm text-gray-500 text-center mt-1.5 mb-4 leading-relaxed">
        {t("auth.otpSubtitle")}
      </p>

      <div className="bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm mb-6">
        <span className="flex items-center gap-2 text-gray-700 truncate mr-2">
          <Mail
            size={15}
            className="shrink-0 text-gray-400"
            aria-hidden="true"
          />
          <span className="truncate font-medium">
            {email || t("auth.registeredEmailFallback") || "your registered email"}
          </span>
        </span>
        <Link
          to={adminPath("/forgot-password")}
          className="text-red-600 font-semibold shrink-0 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 rounded px-1 py-0.5"
        >
          {t("auth.change") || "Change"}
        </Link>
      </div>

      <form onSubmit={verify}>
        <fieldset>
          <legend className="sr-only">
            Enter the 6-digit verification code
          </legend>
          <div
            className="flex justify-between gap-2 mb-5"
            onPaste={handlePaste}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                maxLength={1}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={`Digit ${i + 1} of 6`}
                className="w-12 h-12 text-center border border-gray-300 rounded-xl text-lg font-bold text-gray-900 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600"
              />
            ))}
          </div>
        </fieldset>

        <p className="text-center text-sm text-gray-500 mb-5">
          {t("auth.otpExpiry")}{" "}
          <span
            className={`font-semibold ${secondsLeft === 0 ? "text-red-600" : "text-gray-900"}`}
          >
            {mm}:{ss}
          </span>
        </p>

        {status.error && (
          <p
            role="alert"
            className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-sm font-medium text-center mb-4"
          >
            {status.error}
          </p>
        )}

        {status.success && (
          <p
            role="status"
            className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm font-medium text-center mb-4"
          >
            {status.success}
          </p>
        )}

        <button
          type="submit"
          disabled={status.loading}
          className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>
            {status.loading
              ? t("auth.verifying") || "Verifying…"
              : t("buttons.verifyOtp") || "Verify Code"}
          </span>
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        {t("auth.didntReceiveOtp")}{" "}
        <button
          type="button"
          onClick={resend}
          disabled={resendCooldown > 0}
          className="text-red-600 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 rounded px-1 py-0.5 transition-colors"
        >
          {resendCooldown > 0
            ? `${t("buttons.resendOtp")} (${resendCooldown}s)`
            : t("buttons.resendOtp")}
        </button>
      </p>

      <Link
        to={adminPath("/forgot-password")}
        className="block w-full text-center border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all mt-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
      >
        ← {t("auth.backToForgotPassword") || "Back to Forgot Password"}
      </Link>
    </div>
  );
}
