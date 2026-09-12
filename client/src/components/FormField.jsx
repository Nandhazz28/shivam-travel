import { Children, cloneElement, isValidElement, useId } from "react";

export function FormField({ label, error, children }) {
  const generatedId = useId();
  const childArray = Children.toArray(children);
  const [firstChild, ...restChildren] = childArray;
  const fieldId =
    (isValidElement(firstChild) && firstChild.props.id) || generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;

  const firstChildWithId = isValidElement(firstChild)
    ? cloneElement(firstChild, {
        id: firstChild.props.id || fieldId,
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": errorId,
      })
    : firstChild;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={fieldId}
          className="text-xs font-semibold uppercase tracking-wider text-gray-700"
        >
          {label}
        </label>
      )}
      {firstChildWithId}
      {restChildren}
      {error && (
        <span
          id={errorId}
          role="alert"
          className="text-xs font-medium text-red-600"
        >
          {error}
        </span>
      )}
    </div>
  );
}

export function TextInput({ icon, endAdornment, className = "", ...props }) {
  return (
    <div className="relative">
      {icon && (
        <span
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 ${icon ? "pl-10" : "pl-3.5"} ${endAdornment ? "pr-10" : "pr-3.5"} text-sm text-gray-900 placeholder:text-gray-400 font-medium transition duration-200 focus:outline-none focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-600/10 shadow-xs ${className}`}
      />
      {endAdornment && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          {endAdornment}
        </span>
      )}
    </div>
  );
}

export function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 font-medium transition duration-200 focus:outline-none focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-600/10 shadow-xs resize-y min-h-[100px] ${className}`}
    />
  );
}

export function Select({ children, className = "", ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-3.5 pr-10 text-sm text-gray-900 font-medium appearance-none transition duration-200 focus:outline-none focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-600/10 shadow-xs cursor-pointer ${className}`}
      >
        {children}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

export function PrimaryButton({ children, loading, className = "", ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      className={`w-full bg-red-600 text-white font-bold text-sm py-3 px-6 rounded-xl hover:bg-red-700 active:scale-[0.99] transition duration-150 shadow-sm shadow-red-600/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer ${className}`}
    >
      {loading && (
        <span
          className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
