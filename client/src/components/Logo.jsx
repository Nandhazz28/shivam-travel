import { useBusinessSettings } from "../hooks/useBusinessSettings";

export default function Logo({
  className = "h-10",
  alt = "Shivam Travels — Car with Driver & Travel Services, Mayiladuthurai",
}) {
  const { settings } = useBusinessSettings();

  const commonProps = {
    alt,
    width: 480,
    height: 320,
    className: `w-auto object-contain transition-all duration-300 hover:opacity-95 ${className}`,
    style: { aspectRatio: "480 / 320" },
    loading: "eager",
    decoding: "async",
    fetchpriority: "high",
  };

  if (settings.logo?.url) {
    return <img src={settings.logo.url} {...commonProps} />;
  }

  return <img src="/images/logo.webp" {...commonProps} />;
}
