"use client";

import type { ReactNode } from "react";

export function cx(...a: (string | false | undefined | null)[]) {
  return a.filter(Boolean).join(" ");
}

export const adminInput =
  "w-full rounded-lg border border-white/[0.08] bg-zinc-950/90 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/15";

export const adminSelect = adminInput;

export const adminLabel = "text-[10px] font-semibold uppercase tracking-wider text-zinc-500";

export const adminTh =
  "sticky top-0 z-[1] border-b border-white/[0.06] bg-zinc-900/95 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 backdrop-blur-sm";

export const adminTr = "border-b border-white/[0.04] transition hover:bg-white/[0.02]";

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-500/90">Operations</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 shadow-xl shadow-black/20",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminFilterGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">{children}</div>;
}

export function AdminField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className={adminLabel}>{label}</span>
      {children}
    </label>
  );
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 border-b border-white/[0.06] bg-zinc-950/40 p-4 sm:p-5">{children}</div>;
}

export function AdminChip({
  children,
  onRemove,
  tone = "neutral",
}: {
  children: ReactNode;
  onRemove?: () => void;
  tone?: "neutral" | "cyan" | "amber" | "rose";
}) {
  const tones = {
    neutral: "border-white/[0.08] bg-white/[0.04] text-zinc-400",
    cyan: "border-cyan-500/25 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    rose: "border-rose-500/25 bg-rose-500/10 text-rose-200",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 text-current opacity-70 hover:opacity-100"
          aria-label="Remove filter"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export function AdminTableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="max-h-[min(70vh,720px)] overflow-auto rounded-xl">
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function AdminEmpty({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      {hint ? <div className="max-w-sm text-xs text-zinc-600">{hint}</div> : null}
    </div>
  );
}

export function AdminBtnPrimary({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-cyan-950/30 transition hover:from-cyan-400 hover:to-cyan-300 disabled:opacity-45"
      {...p}
    >
      {children}
    </button>
  );
}

export function AdminBtnGhost({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 transition hover:border-white/[0.18] hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
      {...p}
    >
      {children}
    </button>
  );
}
