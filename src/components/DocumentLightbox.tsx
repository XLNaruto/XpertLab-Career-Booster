import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type DocumentLightboxProps = {
  url: string | null;
  onClose: () => void;
};

const isPdf = (url: string) => /\.pdf(\?.*)?$/i.test(url);

const DocumentLightbox = ({ url, onClose }: DocumentLightboxProps) => {
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [url, onClose]);

  if (!url) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      <div
        className="max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isPdf(url) ? (
          <iframe
            src={url}
            title="Document"
            className="w-full h-[90vh] rounded-lg bg-white"
          />
        ) : (
          <img
            src={url}
            alt="Document"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        )}
      </div>
    </div>,
    document.body,
  );
};

export default DocumentLightbox;
