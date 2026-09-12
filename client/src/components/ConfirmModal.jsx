import { useEffect, useRef, useId, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const modalRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const focusTimer = setTimeout(() => {
      confirmRef.current?.focus();
    }, 10);

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onCancel();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel, loading]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-opacity duration-200"
      onClick={() => !loading && onCancel()}
    >
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl border border-gray-200 transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              tone === "danger"
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
            }`}
            aria-hidden="true"
          >
            <AlertTriangle size={20} />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3
              id={titleId}
              className="font-bold text-black text-base leading-tight"
            >
              {title}
            </h3>
            {message && (
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition duration-150 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading || undefined}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              tone === "danger"
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-600 shadow-red-600/20"
                : "bg-red-600 hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-600 shadow-red-600/20"
            }`}
          >
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState({ open: false });
  const [loading, setLoading] = useState(false);

  const ask = ({
    title,
    message,
    confirmLabel,
    cancelLabel,
    tone,
    onConfirm,
  }) => {
    setState({
      open: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      tone,
      onConfirm,
    });
  };

  const cancel = () => {
    if (loading) return;
    setState({ open: false });
  };

  const confirm = async () => {
    setLoading(true);
    try {
      await state.onConfirm?.();
      setState({ open: false });
    } finally {
      setLoading(false);
    }
  };

  return {
    ask,
    props: {
      open: state.open,
      title: state.title,
      message: state.message,
      confirmLabel: state.confirmLabel,
      cancelLabel: state.cancelLabel,
      tone: state.tone,
      loading,
      onConfirm: confirm,
      onCancel: cancel,
    },
  };
}
