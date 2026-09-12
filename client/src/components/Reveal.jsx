import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  as: Tag = "div",
  className = "",
  delay = 0,
  stagger = 0,
  threshold = 0.15,
  once = true,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once]);

  const totalDelayMs = delay + stagger * 80;

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out will-change-transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
      style={{ transitionDelay: visible ? `${totalDelayMs}ms` : "0ms" }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
