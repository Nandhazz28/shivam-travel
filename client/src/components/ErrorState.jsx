import { AlertCircle, RotateCw } from "lucide-react";

export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4 bg-red-50/40 rounded-2xl border border-red-200 my-4">
      <div
        className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-red-200 text-red-600 flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        <AlertCircle size={26} strokeWidth={1.75} />
      </div>

      <p
        role="alert"
        className="text-sm sm:text-base font-semibold text-black max-w-sm leading-relaxed"
      >
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-xl px-4 py-2.5 shadow-sm hover:bg-red-50 hover:border-red-300 active:bg-red-100 transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
        >
          <RotateCw
            size={15}
            aria-hidden="true"
            className="transition-transform group-hover:rotate-180 duration-500"
          />
          <span>Try again</span>
        </button>
      )}
    </div>
  );
}
