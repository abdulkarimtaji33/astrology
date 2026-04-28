'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export interface RecentEntry {
  id: number;
  name: string;
  birthDate: string;
  cityName?: string;
}

/** @deprecated Kept for any legacy callers; server list is authoritative when logged in. */
export function saveRecentChart(entry: RecentEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('astro_recent');
    const list: RecentEntry[] = raw ? JSON.parse(raw) : [];
    const deduped = list.filter(e => e.id !== entry.id);
    const updated = [entry, ...deduped].slice(0, 6);
    localStorage.setItem('astro_recent', JSON.stringify(updated));
  } catch {
    // ignore
  }
}

type MineRow = {
  id: number;
  name: string;
  birthDate: string;
  cityName: string | null;
};

function formatBirthDate(raw: string): string {
  const s = raw.includes('T') ? raw.slice(0, 10) : raw.slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const sectionTitle =
  'border-l-2 border-amber-500/70 pl-3 text-xs font-medium uppercase tracking-widest text-slate-500 dark:border-amber-400/50 dark:text-white/40';

export default function RecentCharts() {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['my-charts'],
    queryFn: () => api.get<MineRow[]>('/birth-records/mine').then(r => r.data),
    enabled: !!user,
  });

  if (!user) return null;
  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <p className={sectionTitle}>My charts</p>
        <div className="h-20 animate-pulse rounded-xl border border-slate-200/80 bg-white/50 dark:border-white/10 dark:bg-white/[0.04]" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col gap-3">
        <p className={sectionTitle}>My charts</p>
        <div className="rounded-xl border border-dashed border-slate-300/90 bg-white/50 px-4 py-6 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-sm text-slate-600 dark:text-white/45">No saved charts yet.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-white/30">Add birth details to create your first one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className={sectionTitle}>My charts</p>
      <div className="flex flex-col gap-2">
        {data.map(row => (
          <div
            key={row.id}
            className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 px-4 py-3 shadow-sm transition hover:border-amber-300/50 dark:border-white/10 dark:from-white/[0.07] dark:to-white/[0.03] dark:shadow-none dark:hover:border-white/20"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white/90">{row.name}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-white/40">
                {formatBirthDate(row.birthDate)}
                {row.cityName && (
                  <span className="ml-2 text-slate-400 dark:text-white/30">· {row.cityName}</span>
                )}
              </p>
            </div>
            <Link
              href={`/chart/${row.id}`}
              className="ml-3 shrink-0 rounded-lg border border-amber-500/40 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:border-amber-400/50 dark:hover:bg-amber-400/20"
            >
              Open →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
