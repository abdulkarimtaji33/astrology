'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export interface RecentEntry {
  id: number;
  name: string;
  birthDate: string;
  cityName?: string;
}

export function saveRecentChart(entry: RecentEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('astro_recent');
    const list: RecentEntry[] = raw ? JSON.parse(raw) : [];
    const deduped = list.filter(e => e.id !== entry.id);
    const updated = [entry, ...deduped].slice(0, 6);
    localStorage.setItem('astro_recent', JSON.stringify(updated));
  } catch {
    // ignore localStorage errors
  }
}

export default function RecentCharts() {
  const [charts, setCharts] = useState<RecentEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('astro_recent');
      if (raw) setCharts(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  if (charts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="border-l-2 border-amber-400/50 pl-3 text-xs font-medium uppercase tracking-widest text-white/40">
        Recent Charts
      </p>
      <div className="flex flex-col gap-2">
        {charts.map(entry => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] px-4 py-3 transition hover:border-white/20"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white/90">{entry.name}</p>
              <p className="mt-0.5 text-xs text-white/40">
                {entry.birthDate}
                {entry.cityName && <span className="ml-2 text-white/30">· {entry.cityName}</span>}
              </p>
            </div>
            <Link
              href={`/chart/${entry.id}`}
              className="ml-3 shrink-0 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 transition hover:bg-amber-400/20 hover:border-amber-400/50"
            >
              Open →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
