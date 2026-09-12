const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValid24Hour(value) {
  return typeof value === "string" && TIME_RE.test(value);
}

export function from24Hour(value) {
  if (!isValid24Hour(value)) return { hour12: 12, minute: 0, period: "AM" };
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: m, period };
}

export function to24Hour(hour12, minute, period) {
  let h = Number(hour12) % 12;
  if (period === "PM") h += 12;
  const hh = String(h).padStart(2, "0");
  const mm = String(Number(minute)).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatTime12h(value) {
  if (!isValid24Hour(value)) return "—";
  const { hour12, minute, period } = from24Hour(value);
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatDateOnly(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
