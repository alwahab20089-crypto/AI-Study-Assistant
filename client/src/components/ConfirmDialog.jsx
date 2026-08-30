import { useState, useEffect } from "react";

const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  confirmingLabel = "Deleting...",
  onConfirm,
  onCancel,
  isConfirming,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 bg-neutral-900/50 backdrop-blur-sm transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] p-6 w-full max-w-sm transition-all duration-250 ease-out ${
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
        }`}
      >
        <h3 className="text-lg font-serif font-semibold text-neutral-900 mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-neutral-200 text-neutral-600 font-medium py-2.5 text-sm hover:bg-neutral-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="flex-1 rounded-xl bg-red-500 text-white font-medium py-2.5 text-sm hover:bg-red-600 disabled:opacity-60 transition-all duration-200 shadow-sm shadow-red-200 hover:shadow-md hover:shadow-red-200"
          >
            {isConfirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;