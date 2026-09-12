const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function calculateBookingPrice({
  pricing,
  distanceKm = 0,
  durationHours = 0,
  discount = 0,
  tax = 0,
  driverCharges = 0,
} = {}) {
  const safeDistance = Number.isFinite(Number(distanceKm))
    ? Math.max(0, Number(distanceKm))
    : 0;
  const safeDuration = Number.isFinite(Number(durationHours))
    ? Math.max(0, Number(durationHours))
    : 0;
  const safeDiscount = Number.isFinite(Number(discount))
    ? Math.max(0, Number(discount))
    : 0;
  const safeTax = Number.isFinite(Number(tax)) ? Math.max(0, Number(tax)) : 0;
  const safeDriverCharges = Number.isFinite(Number(driverCharges))
    ? Math.max(0, Number(driverCharges))
    : 0;

  if (!pricing) {
    return {
      chargeType: null,
      basePrice: 0,
      driverCharges: safeDriverCharges,
      extraCharges: 0,
      discount: safeDiscount,
      tax: safeTax,
      totalAmount: round2(
        Math.max(0, safeDriverCharges + safeTax - safeDiscount),
      ),
      calculationDetails: {
        note: "No active pricing configured for this vehicle/trip type. Amount shown is 0 until pricing is set.",
      },
    };
  }

  const chargeType = pricing.chargeType || "Package";
  const rate = Number(pricing.rate) || 0;
  let basePrice = 0;
  let extraCharges = 0;
  const calculationDetails = { chargeType, rate };

  if (chargeType === "Per Km") {
    basePrice = round2(rate * safeDistance);
    calculationDetails.distanceKm = safeDistance;
    calculationDetails.formula = `₹${rate}/km × ${safeDistance}km`;
  } else if (chargeType === "Per Hour") {
    basePrice = round2(rate * safeDuration);
    calculationDetails.durationHours = safeDuration;
    calculationDetails.formula = `₹${rate}/hour × ${safeDuration}hr`;
  } else if (chargeType === "Package") {
    basePrice = round2(rate);
    const packageKm = Number(pricing.packageKm) || 0;
    const packageHours = Number(pricing.packageHours) || 0;
    const extraKmRate = Number(pricing.extraKmRate) || 0;
    const extraHourRate = Number(pricing.extraHourRate) || 0;

    const extraKm = packageKm > 0 ? Math.max(0, safeDistance - packageKm) : 0;
    const extraHours =
      packageHours > 0 ? Math.max(0, safeDuration - packageHours) : 0;

    const extraKmCharge = round2(extraKm * extraKmRate);
    const extraHourCharge = round2(extraHours * extraHourRate);
    extraCharges = round2(extraKmCharge + extraHourCharge);

    calculationDetails.packageKm = packageKm;
    calculationDetails.packageHours = packageHours;
    calculationDetails.extraKm = extraKm;
    calculationDetails.extraHours = extraHours;
    calculationDetails.extraKmCharge = extraKmCharge;
    calculationDetails.extraHourCharge = extraHourCharge;
    calculationDetails.formula = `Package ₹${rate}${extraKm ? ` + ${extraKm}km extra @ ₹${extraKmRate}/km` : ""}${extraHours ? ` + ${extraHours}hr extra @ ₹${extraHourRate}/hr` : ""}`;
  } else if (chargeType === "Fixed") {
    basePrice = round2(rate);
    calculationDetails.formula = `Fixed ₹${rate}`;
  }

  const totalAmount = round2(
    Math.max(
      0,
      basePrice + safeDriverCharges + extraCharges + safeTax - safeDiscount,
    ),
  );

  return {
    chargeType,
    basePrice,
    driverCharges: safeDriverCharges,
    extraCharges,
    discount: safeDiscount,
    tax: safeTax,
    totalAmount,
    calculationDetails,
  };
}

export function formatPricingDisplay(pricing) {
  if (!pricing) return "—";
  const rate = Number(pricing.rate) || 0;
  const formatted = `₹${rate.toLocaleString("en-IN")}`;

  switch (pricing.chargeType) {
    case "Per Km":
      return `${formatted}/km`;
    case "Per Hour":
      return `${formatted}/hour`;
    case "Fixed":
      return `${formatted} fixed`;
    case "Package": {
      const parts = [];
      if (pricing.packageHours) parts.push(`${pricing.packageHours}hr`);
      if (pricing.packageKm) parts.push(`${pricing.packageKm}km`);
      return parts.length
        ? `${formatted} (${parts.join(" / ")} package)`
        : `${formatted} package`;
    }
    default:
      return formatted;
  }
}
