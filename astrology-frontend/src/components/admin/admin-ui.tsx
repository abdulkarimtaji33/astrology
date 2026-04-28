"use client";

import type { ReactNode } from "react";

export function cx(...a: (string | false | undefined | null)[]) {
  return a.filter(Boolean).join(" ");
}

export const adminInput =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-cyan-600/50 focus:ring-1 focus:ring-cyan-500/20 dark:border-white/[0.08] dark:bg-zinc-950/90 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-cyan-500/40 dark:focus:ring-cyan-500/15";

export const adminSelect = adminInput;

export const adminLabel =
  "text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500";

export const adminTh =
  "sticky top-0 z-[1] border-b border-zinc-200 bg-zinc-100/95 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-600 backdrop-blur-sm dark:border-white/[0.06] dark:bg-zinc-900/95 dark:text-zinc-500";

export const adminTr =
  "border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-white/[0.04] dark:hover:bg-white/[0.02]";

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
    <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-white/[0.06] sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-500/90">
          Operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-zinc-200/90 bg-white shadow-md dark:border-white/[0.07] dark:bg-gradient-to-b dark:from-zinc-900/80 dark:to-zinc-950/90 dark:shadow-xl dark:shadow-black/20",
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
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50/80 p-4 dark:border-white/[0.06] dark:bg-zinc-950/40 sm:p-5">
      {children}
    </div>
  );
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
    neutral:
      "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400",
    cyan: "border-cyan-300/80 bg-cyan-50 text-cyan-900 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-200",
    amber:
      "border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200",
    rose: "border-rose-300/80 bg-rose-50 text-rose-900 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200",
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
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</p>
      {hint ? <div className="max-w-sm text-xs text-zinc-500 dark:text-zinc-600">{hint}</div> : null}
    </div>
  );
}

export function AdminBtnPrimary({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-45 dark:from-cyan-500 dark:to-cyan-400 dark:text-zinc-950 dark:shadow-cyan-950/30 dark:hover:from-cyan-400 dark:hover:to-cyan-300"
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
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-40 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-white/[0.18] dark:hover:bg-white/[0.06] dark:hover:text-white"
      {...p}
    >
      {children}
    </button>
  );
}
