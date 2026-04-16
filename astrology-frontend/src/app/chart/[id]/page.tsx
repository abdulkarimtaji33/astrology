'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import LagnaChartSVG from '@/components/LagnaChartSVG';
import PlanetTable from '@/components/PlanetTable';
import HouseTable, { HouseDetail } from '@/components/HouseTable';
import TransitPanel from '@/components/TransitPanel';
import NumerologyPanel from '@/components/NumerologyPanel';
import PlanetRelationshipsPanel from '@/components/PlanetRelationshipsPanel';
import AiAnalysisModal, { AiAnalysisResult } from '@/components/AiAnalysisModal';

interface PlanetPosition {
  planet: string;
  longitude: number;
  sign: string;
  signIndex: number;
  degreeInSign: number;
  house: number;
  isRetrograde: boolean;
  dignity: string[];
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

type ChartTab  = 'lagna' | 'moon' | 'transit' | 'numerology' | 'relationships';
type TableView = 'houses' | 'planets';

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
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Left */}
      <div className="flex flex-col items-center gap-4 lg:w-[420px] lg:shrink-0">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-md">
          <LagnaChartSVG chart={chart} />
        </div>
        <div className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-widest text-white/40">{lagnaLabel}</p>
          <p className="mt-1 text-lg font-semibold text-amber-300">
            {chart.lagna.sign}
            <span className="ml-2 text-sm font-normal text-white/60">
              {chart.lagna.degreeInSign.toFixed(2)}°
            </span>
          </p>
          <p className="mt-0.5 text-xs text-white/40">
            {lagnaSubLabel}
            {chart.utcOffsetHours != null && (
              <span className="ml-3">
                UTC {chart.utcOffsetHours >= 0 ? '+' : ''}{chart.utcOffsetHours.toFixed(1)}h
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex gap-1 self-start rounded-lg border border-white/10 bg-white/5 p-1">
          {(['houses', 'planets'] as TableView[]).map(v => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={[
                'px-4 py-1.5 rounded-md text-xs font-medium transition capitalize',
                view === v ? 'bg-amber-400 text-slate-900' : 'text-white/60 hover:text-white/90',
              ].join(' ')}>
              {v === 'houses' ? 'Houses' : 'Planets'}
            </button>
          ))}
        </div>
        {view === 'houses' && chart.houseDetails
          ? <HouseTable houses={chart.houseDetails} chartId={chartId} chartKind={chartKind} />
          : <PlanetTable planets={chart.planets} />}
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

export default function ChartPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ChartTab>('lagna');
  const queryClient = useQueryClient();

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [aiData, setAiData] = useState<AiAnalysisResult | null>(null);
  const [aiModalPeriod, setAiModalPeriod] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['birth-summary', id],
    queryFn: () => api.get<BirthSummary>(`/birth-records/${id}/summary`).then(r => r.data),
  });

  const { data: lagnaChart, isLoading: lagnaLoading, isError: lagnaError } = useQuery({
    queryKey: ['chart', id],
    queryFn: () => api.get<ChartData>(`/birth-records/${id}/chart`).then(r => r.data),
  });

  const { data: moonChart, isLoading: moonLoading } = useQuery({
    queryKey: ['moon-chart', id],
    queryFn: () => api.get<ChartData>(`/birth-records/${id}/moon-chart`).then(r => r.data),
    enabled: activeTab === 'moon',
  });

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

  const TAB_META: Record<ChartTab, { label: string; desc: string }> = {
    lagna:         { label: 'Lagna',         desc: 'D1 · Lahiri Ayanamsa · Whole Sign Houses' },
    moon:          { label: 'Moon',          desc: 'Chandra Lagna · Moon as Ascendant' },
    transit:       { label: 'Transit',       desc: 'Planetary Transits · Chandra Lagna (from Moon sign)' },
    numerology:    { label: 'Numerology',    desc: 'Lo Shu Grid · Driver · Conductor · Personal Year' },
    relationships: { label: 'Relationships', desc: 'Naisargika Maitri · Natural Planetary Friendships' },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(251,191,36,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(99,102,241,0.2) 0%, transparent 50%)`,
        }}
      />
      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">

        <AiAnalysisModal
          isOpen={aiOpen}
          isLoading={aiLoading}
          isError={aiError}
          data={aiData}
          transitPeriod={aiModalPeriod}
          onClose={() => setAiOpen(false)}
        />

        {/* header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Vedic Birth Chart
            </h1>
            {summary && (
              <p className="mt-2 text-sm text-white/65">
                <span className="font-medium text-white/90">{summary.name}</span>
                <span className="mx-2 text-white/25">·</span>
                <span className="tabular-nums">{summary.birthDate}</span>
                <span className="mx-2 text-white/25">·</span>
                <span className="tabular-nums">{summary.birthTime}</span>
                {summary.cityName && (
                  <>
                    <span className="mx-2 text-white/25">·</span>
                    <span>{summary.cityName}</span>
                  </>
                )}
                {summary.timezone && (
                  <span className="ml-2 text-white/40">({summary.timezone})</span>
                )}
              </p>
            )}
            <p className="mt-1 text-sm text-white/50">{TAB_META[activeTab].desc}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runGlobalAi}
              disabled={aiLoading}
              className="flex items-center gap-2 rounded-lg border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/25 hover:border-violet-400/60 disabled:opacity-50"
            >
              <span>✦</span>
              Analyze with AI
            </button>
            <a href="/"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10">
              ← New Chart
            </a>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-8 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
          {(['lagna', 'moon', 'transit', 'numerology', 'relationships'] as ChartTab[]).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={[
                'px-5 py-2 rounded-lg text-sm font-medium transition',
                activeTab === tab
                  ? 'bg-amber-400 text-slate-900 shadow'
                  : 'text-white/55 hover:text-white/90',
              ].join(' ')}>
              {TAB_META[tab].label}
            </button>
          ))}
        </div>

        {/* Error */}
        {lagnaError && (
          <p className="rounded-xl bg-red-500/20 p-4 text-red-200">
            Failed to load chart. Please go back and try again.
          </p>
        )}

        {/* Spinner */}
        {isLoading && (
          <div className="flex items-center justify-center py-32">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          </div>
        )}

        {/* Lagna tab */}
        {activeTab === 'lagna' && lagnaChart && !lagnaLoading && id && (
          <ChartSection
            chart={lagnaChart}
            lagnaLabel="Lagna"
            lagnaSubLabel={`Ayanamsa ${lagnaChart.ayanamsa.toFixed(4)}°`}
            chartId={id}
            chartKind="lagna"
          />
        )}

        {/* Moon tab */}
        {activeTab === 'moon' && moonChart && !moonLoading && id && (
          <ChartSection
            chart={moonChart}
            lagnaLabel="Chandra Lagna"
            lagnaSubLabel={`Ayanamsa ${moonChart.ayanamsa.toFixed(4)}°`}
            chartId={id}
            chartKind="moon"
          />
        )}

        {/* Transit tab */}
        {activeTab === 'transit' && (
          <TransitPanel chartId={id} natalLagna={lagnaChart?.lagna} />
        )}

        {/* Numerology tab */}
        {activeTab === 'numerology' && (
          <NumerologyPanel chartId={id} />
        )}

        {/* Relationships tab */}
        {activeTab === 'relationships' && (
          <PlanetRelationshipsPanel />
        )}

      </main>
    </div>
  );
}
