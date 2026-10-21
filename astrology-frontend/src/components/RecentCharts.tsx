'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

function DeleteButton({ id, name }: { id: number; name: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const doDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/birth-records/${id}`);
      void queryClient.invalidateQueries({ queryKey: ['my-charts'] });
      setOpen(false);
    } catch {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${name}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-500/10 hover:text-red-500"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" aria-label="Cancel" className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="app-card relative z-10 w-full max-w-sm p-6 text-center !bg-white dark:!bg-slate-900">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-xl">🗑</div>
            <h3 className="text-xl font-semibold">Delete this chart?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-white/55">
              <span className="font-semibold">{name}</span> will be permanently removed.
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary flex-1">Keep it</button>
              <button type="button" onClick={doDelete} disabled={loading} className="btn btn-danger flex-1">
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '✦';
}

export default function RecentCharts() {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['my-charts'],
    queryFn: () => api.get<MineRow[]>('/birth-records/mine').then(r => r.data),
    enabled: !!user,
  });

  if (!user) return null;

  const header = (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="eyebrow">Saved</p>
        <h2 className="text-2xl font-semibold">My charts</h2>
      </div>
      {data && data.length > 0 && <span className="chip">{data.length}</span>}
    </div>
  );

  if (authLoading || isLoading) {
    return (
      <div>
        {header}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="skeleton h-20" />)}
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-dashed px-6 py-10 text-center" style={{ borderColor: 'var(--app-border-strong)' }}>
          <p className="text-3xl" aria-hidden>✦</p>
          <p className="mt-2 font-semibold">No saved charts yet</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/50">Fill in your birth details above to create your first chart.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map(row => (
          <li key={row.id} className="app-card flex items-center gap-1 p-2 pr-1 transition hover:-translate-y-0.5" style={{ border: '1px solid var(--app-border)' }}>
            <Link href={`/chart/${row.id}`} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-600 text-sm font-bold text-slate-900">
                {initials(row.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{row.name}</span>
                <span className="block truncate text-xs text-slate-500 dark:text-white/45">
                  {formatBirthDate(row.birthDate)}
                  {row.cityName ? ` · ${row.cityName}` : ''}
                </span>
              </span>
              <span aria-hidden className="ml-auto pl-2 text-slate-400">›</span>
            </Link>
            <DeleteButton id={row.id} name={row.name} />
          </li>
        ))}
      </ul>
    </div>
  );
}
