"use client";

import adminApi from "@/lib/adminApi";
import { useQuery } from "@tanstack/react-query";

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.get<Record<string, number>>("/admin/stats").then((r) => r.data),
  });

  const statCards = data
    ? [
        { label: "Birth records", value: data.birthRecords, tone: "from-amber-500/20 to-amber-600/5" },
        { label: "AI analyses", value: data.aiAnalyses, tone: "from-violet-500/20 to-violet-600/5" },
        { label: "Cities (geo DB)", value: data.cities, tone: "from-sky-500/20 to-sky-600/5" },
        { label: "Countries", value: data.countries, tone: "from-emerald-500/20 to-emerald-600/5" },
        { label: "States", value: data.states, tone: "from-teal-500/20 to-teal-600/5" },
        { label: "Regions", value: data.regions, tone: "from-rose-500/20 to-rose-600/5" },
        { label: "PHI rows", value: data.planetHouseInterpretations, tone: "from-amber-400/15" },
        { label: "Drishti rows", value: data.planetDrishti, tone: "from-orange-500/20" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-amber-50">Overview</h1>
      <p className="mt-1 text-sm text-slate-500">Database tables at a glance.</p>

      {isError && (
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
        >
          Failed to load. Retry
        </button>
      )}

      {isLoading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}

      {data && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {statCards.map((c) => (
            <li
              key={c.label}
              className={`rounded-xl border border-white/10 bg-gradient-to-br p-4 ${c.tone}`}
            >
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</div>
              <div className="mt-1 font-mono text-2xl text-slate-100">{c.value.toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
