"use client";

import { AdminPageHeader, AdminPanel, cx } from "@/components/admin/admin-ui";
import adminApi from "@/lib/adminApi";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

function IcoRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8a6 6 0 1 0 1.5-4M2 4v4h4" />
    </svg>
  );
}

const links = [
  { href: "/admin/birth-records", label: "Birth records", desc: "Charts & metadata" },
  { href: "/admin/ai-analyses", label: "AI analyses", desc: "LLM cache" },
  { href: "/admin/jyotish", label: "Jyotish data", desc: "Reference tables" },
  { href: "/admin/geo", label: "Geography", desc: "Regions → cities" },
] as const;

export default function AdminDashboard() {
  const q = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.get<Record<string, number>>("/admin/stats").then((r) => r.data),
  });

  const metrics = q.data
    ? [
        { k: "Birth records", v: q.data.birthRecords, href: "/admin/birth-records" },
        { k: "AI analyses", v: q.data.aiAnalyses, href: "/admin/ai-analyses" },
        { k: "Cities", v: q.data.cities, href: "/admin/geo" },
        { k: "Countries", v: q.data.countries, href: "/admin/geo" },
        { k: "States", v: q.data.states, href: "/admin/geo" },
        { k: "Regions", v: q.data.regions, href: "/admin/geo" },
        { k: "PHI rows", v: q.data.planetHouseInterpretations, href: "/admin/jyotish" },
        { k: "Drishti rules", v: q.data.planetDrishti, href: "/admin/jyotish" },
      ]
    : [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Overview"
        subtitle="Live counts from the API. Each section below links into filtered data management."
        actions={
          <button
            type="button"
            onClick={() => void q.refetch()}
            disabled={q.isRefetching}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-cyan-500/30 hover:text-white disabled:opacity-40"
          >
            <IcoRefresh className={cx("h-3.5 w-3.5", q.isRefetching && "animate-spin")} />
            Refresh
          </button>
        }
      />

      {q.isError && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          Failed to load stats.{" "}
          <button type="button" className="underline underline-offset-2" onClick={() => void q.refetch()}>
            Retry
          </button>
        </div>
      )}

      <AdminPanel>
        <div className="p-4 sm:p-6">
          {q.isLoading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          )}
          {q.data && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((m) => (
                <Link
                  key={m.k}
                  href={m.href}
                  className="group rounded-xl border border-white/[0.07] bg-zinc-950/50 p-4 transition hover:border-cyan-500/35 hover:bg-cyan-500/[0.04]"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 group-hover:text-cyan-500/90">{m.k}</p>
                  <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-white">{m.v.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-zinc-600 group-hover:text-zinc-500">Open section →</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </AdminPanel>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Shortcuts</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-zinc-300 transition hover:border-cyan-500/25 hover:bg-white/[0.05] hover:text-white"
            >
              <span className="font-medium">{l.label}</span>
              <span className="mt-0.5 block text-xs text-zinc-600">{l.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
