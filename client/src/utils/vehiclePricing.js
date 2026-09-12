export function formatVehiclePricingLines(pricingSummary) {
  const lines = [];
  const perKm = pricingSummary?.perKm;
  const perHour = pricingSummary?.perHour;

  if (typeof perKm === "number" && Number.isFinite(perKm) && perKm > 0) {
    lines.push(`₹${perKm}/km`);
  }
  if (typeof perHour === "number" && Number.isFinite(perHour) && perHour > 0) {
    lines.push(`₹${perHour}/hour`);
  }
  return lines;
}

export function formatVehiclePricingCompact(pricingSummary, fallback = "Contact for pricing") {
  const lines = formatVehiclePricingLines(pricingSummary);
  return lines.length > 0 ? lines.join(" · ") : fallback;
}
