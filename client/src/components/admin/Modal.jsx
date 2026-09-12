import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      const previousElement = previousActiveElementRef.current;

      if (
        previousElement instanceof HTMLElement &&
        previousElement.isConnected
      ) {
        previousElement.focus();
      }

      previousActiveElementRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onCloseRef.current?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <h3
            id={titleId}
            className="font-bold text-lg tracking-tight text-black"
          >
            {title}
          </h3>

          <button
            type="button"
            onClick={() => onCloseRef.current?.()}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-gray-500 transition duration-150 hover:bg-gray-100 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 text-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
}