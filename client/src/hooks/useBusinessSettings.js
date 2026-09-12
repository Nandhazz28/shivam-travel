export { useBusinessSettingsContext as useBusinessSettings } from "../context/BusinessSettingsContext";

export function whatsappLink(number, message) {
  const clean = (number || "").replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message || "Hello Shivam Travels, I would like to enquire about your service.")}`;
}

export function telLink(number) {
  return `tel:${(number || "").replace(/\s/g, "")}`;
}
