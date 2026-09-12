import { Clock } from "lucide-react";
import { from24Hour, to24Hour } from "../utils/datetime";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export default function TimeInput12h({ value, onChange, id, disabled }) {
  const { hour12, minute, period } = from24Hour(value);

  const nearestMinute = MINUTES.reduce(
    (best, m) => (Math.abs(m - minute) < Math.abs(best - minute) ? m : best),
    0,
  );

  const emit = (nextHour12, nextMinute, nextPeriod) => {
    onChange(to24Hour(nextHour12, nextMinute, nextPeriod));
  };

  const selectClass =
    "bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-2.5 text-sm text-gray-800 font-medium appearance-none transition-all focus:outline-none focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-600/10 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600";

  return (
    <div id={id} className="flex items-center gap-2">
      <span className="text-gray-400 shrink-0" aria-hidden="true">
        <Clock size={16} />
      </span>

      <select
        aria-label="Hour"
        className={selectClass}
        value={hour12}
        disabled={disabled}
        onChange={(e) => emit(Number(e.target.value), nearestMinute, period)}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="text-gray-400 font-semibold select-none">:</span>

      <select
        aria-label="Minute"
        className={selectClass}
        value={nearestMinute}
        disabled={disabled}
        onChange={(e) => emit(hour12, Number(e.target.value), period)}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </select>

      <div
        className="flex rounded-xl border border-gray-200 overflow-hidden shrink-0 shadow-xs"
        role="group"
        aria-label="AM or PM"
      >
        {["AM", "PM"].map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            aria-pressed={period === p}
            onClick={() => emit(hour12, nearestMinute, p)}
            className={`px-3 py-2.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600 ${
              period === p
                ? "bg-red-600 text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
