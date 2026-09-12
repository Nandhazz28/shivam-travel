import { useState } from "react";

const SIZES = {
  sm: "w-8 h-8 text-xs font-semibold",
  md: "w-9 h-9 text-sm font-bold",
  lg: "w-14 h-14 text-base font-bold",
};

export default function Avatar({ name, src, size = "md", className = "" }) {
  const [hasError, setHasError] = useState(false);

  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const sizeClass = SIZES[size] || SIZES.md;

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`rounded-full object-cover shrink-0 border border-gray-200 shadow-sm ${sizeClass} ${className}`}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gray-100 text-black border border-gray-200 shadow-sm flex items-center justify-center shrink-0 select-none ${sizeClass} ${className}`}
      aria-label={name || "User avatar"}
      role="img"
    >
      {initials || "?"}
    </div>
  );
}
