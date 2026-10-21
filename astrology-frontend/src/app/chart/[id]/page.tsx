'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import LagnaChartSVG from '@/components/LagnaChartSVG';
import PlanetTable from '@/components/PlanetTable';
import HouseTable, { HouseDetail } from '@/components/HouseTable';
import TransitPanel from '@/components/TransitPanel';
import NumerologyPanel from '@/components/NumerologyPanel';
import PlanetRelationshipsPanel from '@/components/PlanetRelationshipsPanel';
import SaturnPanel from '@/components/SaturnPanel';
import AiAnalysisModal, { AiAnalysisResult } from '@/components/AiAnalysisModal';
import AstroSummaryStrip from '@/components/AstroSummaryStrip';

interface PlanetPosition {
  planet: string;
  longitude: number;
  sign: string;
  signIndex: number;
  degreeInSign: number;
  house: number;
  isRetrograde: boolean;
  dignity: string[];
  avastha?: {
    name: string | null;
    englishName: string | null;
    effectPercent: number | null;
    degreeFrom: string | null;
    degreeTo: string | null;
  } | null;
}

interface HouseInfo {
  house: number;
  sign: string;
  signIndex: number;
  planets: string[];
}

export interface ChartData {
  lagna: {
    longitude: number;
    sign: string;
    signIndex: number;
    degreeInSign: number;
  };
  planets: PlanetPosition[];
  houses: HouseInfo[];
  ayanamsa: number;
  julianDay: number;
  utcOffsetHours: number;
  houseDetails?: HouseDetail[];
}

type ChartTab  = 'lagna' | 'moon' | 'transit' | 'numerology' | 'relationships' | 'saturn';
type TableView = 'houses' | 'planets';

const SIGN_ELEMENT: Record<string, { label: string; cls: string }> = {
  Aries:       { label: 'Fire element',  cls: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
  Leo:         { label: 'Fire element',  cls: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
  Sagittarius: { label: 'Fire element',  cls: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
  Taurus:      { label: 'Earth element', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  Virgo:       { label: 'Earth element', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  Capricorn:   { label: 'Earth element', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  Gemini:      { label: 'Air element',   cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400' },
  Libra:       { label: 'Air element',   cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400' },
  Aquarius:    { label: 'Air element',   cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400' },
  Cancer:      { label: 'Water element', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  Scorpio:     { label: 'Water element', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  Pisces:      { label: 'Water element', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
};

// ─── Edit birth date/time modal ────────────────────────────────────────────
function EditBirthModal({
  chartId,
  initialDate,
  initialTime,
  onClose,
  onSaved,
}: {
  chartId: string;
  initialDate: string;
  initialTime: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime.slice(0, 5));
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const overlayRef = useRef<HTMLDivElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.patch(`/birth-records/${chartId}`, { birthDate: date, birthTime: time });
      onSaved();
      onClose();
    } catch {
      setStatus('error');
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-white/[0.12] dark:bg-[#0f0f1a]">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 dark:border-white/8">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white/90">Edit Birth Date & Time</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/70 text-lg leading-none p-1">✕</button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-white/40">Birth Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white/90 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-400/30 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-white/40">Birth Time</label>
            <input
              type="time"
              required
              value={time}
              onChange={e => setTime(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white/90 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-400/30 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          {status === 'error' && (
            <p className="text-[11px] text-red-500 dark:text-red-400">Failed to update. Please try again.</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex-1 rounded-xl border border-amber-500/50 bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 dark:border-amber-400/50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {status === 'loading' ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-600 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ──────────────────────────────────────────────────
function DeleteConfirmModal({
  chartId,
  chartName,
  onClose,
  onDeleted,
}: {
  chartId: string;
  chartName: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const overlayRef = useRef<HTMLDivElement>(null);

  const confirm = async () => {
    setStatus('loading');
    try {
      await api.delete(`/birth-records/${chartId}`);
      onDeleted();
    } catch {
      setStatus('error');
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-red-300/40 bg-white shadow-2xl dark:border-red-400/20 dark:bg-[#0f0f1a]">
        <div className="px-6 py-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-500/15">🗑</div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white/90">Delete Chart?</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-white/50">
            <span className="font-medium text-slate-800 dark:text-white/80">{chartName}</span> will be permanently deleted.
            This cannot be undone.
          </p>
          {status === 'error' && (
            <p className="mt-3 text-[11px] text-red-500 dark:text-red-400">Failed to delete. Please try again.</p>
          )}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={status === 'loading'}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-400"
            >
              {status === 'loading' ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200/90 dark:border-white/10 py-2.5 text-sm text-slate-600 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared chart + table layout ───────────────────────────────────────────
function ChartSection({
  chart,
  lagnaLabel,
  lagnaSubLabel,
  chartId,
  chartKind,
}: {
  chart: ChartData;
  lagnaLabel: string;
  lagnaSubLabel: string;
  chartId: string;
  chartKind: 'lagna' | 'moon';
}) {
  const [view, setView] = useState<TableView>('houses');

  return (
    <div className="fade-up flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <div className="flex flex-col items-center gap-4 lg:w-[420px] lg:shrink-0">
        <div className="app-card mx-auto w-full max-w-[460px] p-3 sm:p-4" style={{ border: "1px solid var(--app-border)" }}>
          <LagnaChartSVG chart={chart} />
        </div>
        <div className="app-card w-full px-5 py-4" style={{ border: "1px solid var(--app-border)" }}>
          <p className="border-l-2 border-amber-500/60 pl-2 text-xs font-medium uppercase tracking-widest text-slate-500 dark:border-amber-400/50 dark:text-white/40">
            {lagnaLabel}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
              {chart.lagna.sign}
              <span className="ml-2 text-sm font-normal text-slate-600 dark:text-white/60">
                {chart.lagna.degreeInSign.toFixed(2)}°
              </span>
            </p>
            {SIGN_ELEMENT[chart.lagna.sign] && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SIGN_ELEMENT[chart.lagna.sign].cls}`}>
                {SIGN_ELEMENT[chart.lagna.sign].label}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-white/40">
            {lagnaSubLabel}
            {chart.utcOffsetHours != null && (
              <span className="ml-3">
                UTC {chart.utcOffsetHours >= 0 ? '+' : ''}
                {chart.utcOffsetHours.toFixed(1)}h
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-1 rounded-2xl border p-1 sm:inline-grid sm:w-64" style={{ borderColor: 'var(--app-border)', background: 'rgba(127,127,127,.08)' }}>
          {(['houses', 'planets'] as TableView[]).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={[
                'min-h-10 rounded-xl px-4 text-sm font-semibold transition',
                view === v
                  ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white/90',
              ].join(' ')}
            >
              {v === 'houses' ? 'Houses' : 'Planets'}
            </button>
          ))}
        </div>
        {view === 'houses' && chart.houseDetails ? (
          <HouseTable houses={chart.houseDetails} chartId={chartId} chartKind={chartKind} />
        ) : (
          <PlanetTable planets={chart.planets} />
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
interface BirthSummary {
  id: number;
  name: string;
  birthDate: string;
  birthTime: string;
  cityName: string | null;
  timezone: string | null;
}

function globalAiRange() {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  const year = new Date().getFullYear();
  return { from, to, year };
}

const TAB_META: Record<ChartTab, { label: string; icon: string; desc: string }> = {
  lagna:         { label: 'Lagna',         icon: '☉', desc: 'D1 · Lahiri Ayanamsa · Whole Sign Houses' },
  moon:          { label: 'Moon',          icon: '☽', desc: 'Chandra Lagna · Moon as Ascendant' },
  transit:       { label: 'Transit',       icon: '⟳', desc: 'Planetary Transits · Chandra Lagna (from Moon sign)' },
  numerology:    { label: 'Numerology',    icon: '#',  desc: 'Lo Shu Grid · Driver · Conductor · Personal Year' },
  relationships: { label: 'Relationships', icon: '⚭', desc: 'Naisargika Maitri · Natural Planetary Friendships' },
  saturn:        { label: 'Saturn',        icon: '♄', desc: 'Sade Sati · Dhaiyya (Kantaka Shani)' },
};

export default function ChartPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTabState] = useState<ChartTab>('lagna');
  const queryClient = useQueryClient();
  const tabBarRef = useRef<HTMLDivElement>(null);

  const setActiveTab = (t: ChartTab) => {
    setActiveTabState(t);
    try {
      window.history.replaceState(null, '', `#${t}`);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const h = window.location.hash.replace('#', '') as ChartTab;
    if (h && h in TAB_META) setActiveTabState(h);
  }, []);

  useEffect(() => {
    const el = tabBarRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeTab]);

  const canFetch = Boolean(user && id);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const next = pathname || `/chart/${id}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [authLoading, user, router, pathname, id]);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [aiData, setAiData] = useState<AiAnalysisResult | null>(null);
  const [aiModalPeriod, setAiModalPeriod] = useState('');

  const { data: summary, error: summaryError } = useQuery({
    queryKey: ['birth-summary', id],
    queryFn: () => api.get<BirthSummary>(`/birth-records/${id}/summary`).then(r => r.data),
    enabled: canFetch,
    retry: (n, err) => {
      const s = isAxiosError(err) ? err.response?.status : undefined;
      if (s === 401 || s === 403) return false;
      return n < 2;
    },
  });

  const { data: lagnaChart, isLoading: lagnaLoading, isError: lagnaError, error: lagnaErr } =
    useQuery({
      queryKey: ['chart', id],
      queryFn: () => api.get<ChartData>(`/birth-records/${id}/chart`).then(r => r.data),
      enabled: canFetch,
      retry: (n, err) => {
        const s = isAxiosError(err) ? err.response?.status : undefined;
        if (s === 401 || s === 403) return false;
        return n < 2;
      },
    });

  const { data: moonChart, isLoading: moonLoading } = useQuery({
    queryKey: ['moon-chart', id],
    queryFn: () => api.get<ChartData>(`/birth-records/${id}/moon-chart`).then(r => r.data),
    enabled: canFetch && activeTab === 'moon',
    retry: (n, err) => {
      const s = isAxiosError(err) ? err.response?.status : undefined;
      if (s === 401 || s === 403) return false;
      return n < 2;
    },
  });

  const accessDenied =
    [summaryError, lagnaErr].some(
      e => isAxiosError(e) && (e.response?.status === 403 || e.response?.status === 404),
    ) ?? false;

  const isLoading = activeTab === 'lagna' ? lagnaLoading : activeTab === 'moon' ? moonLoading : false;

  const runGlobalAi = async () => {
    const { from, to, year } = globalAiRange();
    setAiModalPeriod(`${from} to ${to}`);
    setAiData(null);
    setAiError(false);
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await api.get<AiAnalysisResult>(
        `/birth-records/${id}/ai-analysis?from=${from}&to=${to}&year=${year}`,
        { timeout: 10 * 60 * 1000 },
      );
      setAiData(res.data);
      queryClient.invalidateQueries({ queryKey: ['ai-analyses', id] });
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent dark:border-amber-400" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-5 sm:px-6 sm:pt-8">

        <AiAnalysisModal
          isOpen={aiOpen}
          isLoading={aiLoading}
          isError={aiError}
          data={aiData}
          transitPeriod={aiModalPeriod}
          onClose={() => setAiOpen(false)}
        />

        {editOpen && summary && (
          <EditBirthModal
            chartId={id}
            initialDate={summary.birthDate}
            initialTime={summary.birthTime}
            onClose={() => setEditOpen(false)}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['birth-summary', id] });
              queryClient.invalidateQueries({ queryKey: ['chart', id] });
              queryClient.invalidateQueries({ queryKey: ['moon-chart', id] });
              queryClient.invalidateQueries({ queryKey: ['my-charts'] });
            }}
          />
        )}

        {deleteOpen && summary && (
          <DeleteConfirmModal
            chartId={id}
            chartName={summary.name}
            onClose={() => setDeleteOpen(false)}
            onDeleted={() => {
              queryClient.invalidateQueries({ queryKey: ['my-charts'] });
              router.replace('/');
            }}
          />
        )}

        {/* header */}
        <div className="fade-up mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="eyebrow mb-1">Vedic birth chart</p>
            {summary ? (
              <>
                <h1 className="truncate text-3xl font-semibold sm:text-4xl">{summary.name}</h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="chip tabular-nums">📅 {summary.birthDate.slice(0, 10)}</span>
                  <span className="chip tabular-nums">🕐 {summary.birthTime.slice(0, 5)}</span>
                  {summary.cityName && <span className="chip">📍 {summary.cityName}</span>}
                  {summary.timezone && <span className="chip hidden sm:inline-flex">{summary.timezone}</span>}
                </div>
              </>
            ) : (
              <div className="skeleton h-10 w-56" />
            )}
          </div>
          {!accessDenied && (
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                onClick={runGlobalAi}
                disabled={aiLoading}
                className="btn btn-primary col-span-2 sm:order-last"
              >
                <span aria-hidden>✦</span> Analyze with AI
              </button>
              {summary && (
                <>
                  <button type="button" onClick={() => setEditOpen(true)} className="btn btn-secondary">
                    ✎ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="btn btn-secondary !text-red-600 hover:!border-red-400 dark:!text-red-300"
                  >
                    🗑 Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {accessDenied ? (
          <div className="rounded-2xl border border-amber-300/60 bg-white/90 p-8 text-center shadow-sm backdrop-blur-sm dark:border-amber-400/25 dark:bg-white/[0.04]">
            <p className="text-lg font-medium text-slate-900 dark:text-white/90">This chart is not on your account</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-white/45">You can only open charts you created while signed in.</p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <>
            {/* Astro summary strip — always visible */}
            {id && <div className="mb-6"><AstroSummaryStrip chartId={id} /></div>}

            {/* Tab bar — sticky, scrollable, full labels */}
            <div
              className="sticky top-14 z-30 -mx-4 mb-6 border-y px-4 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-2"
              style={{ background: 'var(--nav-bg)', borderColor: 'var(--app-border)' }}
            >
              <div
                ref={tabBarRef}
                role="tablist"
                aria-label="Chart sections"
                className="scrollbar-hide flex snap-x gap-1 overflow-x-auto py-2"
              >
                {(['lagna', 'moon', 'transit', 'numerology', 'relationships', 'saturn'] as ChartTab[]).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={[
                      'flex min-h-11 shrink-0 snap-center items-center gap-2 rounded-xl px-4 text-sm font-semibold transition',
                      activeTab === tab
                        ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 shadow-md shadow-amber-500/25'
                        : 'text-slate-600 hover:bg-slate-500/10 dark:text-white/60 dark:hover:text-white',
                    ].join(' ')}
                  >
                    <span aria-hidden className="text-base leading-none">{TAB_META[tab].icon}</span>
                    {TAB_META[tab].label}
                  </button>
                ))}
              </div>
            </div>
            <p className="-mt-3 mb-5 text-xs text-slate-500 dark:text-white/40">{TAB_META[activeTab].desc}</p>

            {lagnaError && (
              <p className="rounded-xl bg-red-100 p-4 text-red-800 dark:bg-red-500/20 dark:text-red-200">
                Failed to load chart. Please go back and try again.
              </p>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center gap-4 py-32">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-[0_0_20px_rgba(251,191,36,0.2)] dark:border-amber-400 dark:shadow-[0_0_20px_rgba(251,191,36,0.3)]" />
                <p className="text-sm text-slate-500 dark:text-white/40">Loading chart…</p>
              </div>
            )}

            {activeTab === 'lagna' && lagnaChart && !lagnaLoading && id && (
              <ChartSection
                chart={lagnaChart}
                lagnaLabel="Lagna"
                lagnaSubLabel={`Ayanamsa ${lagnaChart.ayanamsa.toFixed(4)}°`}
                chartId={id}
                chartKind="lagna"
              />
            )}

            {activeTab === 'moon' && moonChart && !moonLoading && id && (
              <ChartSection
                chart={moonChart}
                lagnaLabel="Chandra Lagna"
                lagnaSubLabel={`Ayanamsa ${moonChart.ayanamsa.toFixed(4)}°`}
                chartId={id}
                chartKind="moon"
              />
            )}

            {activeTab === 'transit' && (
              <TransitPanel chartId={id} natalLagna={lagnaChart?.lagna} accountEmail={user.email} />
            )}

            {activeTab === 'numerology' && <NumerologyPanel chartId={id} />}

            {activeTab === 'relationships' && <PlanetRelationshipsPanel />}

            {activeTab === 'saturn' && id && <SaturnPanel chartId={id} />}
          </>
        )}

      </div>
    </div>
  );
}
