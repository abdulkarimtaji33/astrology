"use client";

import { useEffect } from "react";

export function Modal({
  open,
  title,
  children,
  onClose,
  wide,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className={`relative z-10 max-h-[min(90vh,900px)] w-full overflow-y-auto rounded-2xl border border-amber-500/20 bg-[#0f1419] shadow-2xl shadow-amber-900/20 ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#0f1419]/95 px-5 py-3 backdrop-blur">
          <h2 className="text-sm font-semibold tracking-tight text-amber-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
