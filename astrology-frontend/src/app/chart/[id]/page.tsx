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
import SaturnPanel from '@/components/SaturnPanel';
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

type ChartTab  = 'lagna' | 'moon' | 'transit' | 'numerology' | 'relationships' | 'saturn';
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
        <div className="w-full rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-4 shadow-xl backdrop-blur-md">
          <LagnaChartSVG chart={chart} />
        </div>
        <div className="w-full rounded-xl border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.03] px-5 py-4">
          <p className="border-l-2 border-amber-400/50 pl-2 text-xs font-medium uppercase tracking-widest text-white/40">{lagnaLabel}</p>
          <p className="mt-2 text-lg font-semibold text-amber-300">
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
                'px-4 py-1.5 rounded-md text-xs font-medium transition',
                view === v ? 'bg-amber-400 text-slate-900 shadow-md shadow-amber-400/20' : 'text-white/60 hover:text-white/90',
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

  return (
    <div className="relative min-h-[calc(100vh-3rem)] overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(ellipse at 20% 80%, rgba(251,191,36,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.18) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 50%, rgba(139,92,246,0.08) 0%, transparent 50%)`,
        }}
      />
      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">

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
            {summary ? (
              <>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {summary.name}
                </h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/55">
                  <span className="tabular-nums">{summary.birthDate}</span>
                  <span className="text-white/20">·</span>
                  <span className="tabular-nums">{summary.birthTime}</span>
                  {summary.cityName && (
                    <>
                      <span className="text-white/20">·</span>
                      <span>{summary.cityName}</span>
                    </>
                  )}
                  {summary.timezone && (
                    <span className="text-white/35">({summary.timezone})</span>
                  )}
                </p>
              </>
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Vedic Birth Chart
              </h1>
            )}
            <p className="mt-1 text-xs text-white/35">{TAB_META[activeTab].desc}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runGlobalAi}
              disabled={aiLoading}
              className="flex items-center gap-2 rounded-lg border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-200 shadow-[0_0_16px_rgba(139,92,246,0.1)] transition hover:bg-violet-500/25 hover:border-violet-400/60 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] disabled:opacity-50"
            >
              <span>✦</span>
              Analyze with AI
            </button>
          </div>
        </div>

        {/* Tab bar — scrollable on mobile */}
        <div className="-mx-4 mb-8 sm:mx-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide border-y border-white/10 bg-white/[0.03] px-4 py-1.5 sm:w-fit sm:rounded-xl sm:border sm:border-white/10 sm:bg-white/5 sm:px-1 sm:py-1">
            {(['lagna', 'moon', 'transit', 'numerology', 'relationships', 'saturn'] as ChartTab[]).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={[
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4',
                  activeTab === tab
                    ? 'bg-amber-400 text-slate-900 shadow-md shadow-amber-400/25'
                    : 'text-white/55 hover:text-white/90 hover:bg-white/5',
                ].join(' ')}>
                <span className="text-base leading-none">{TAB_META[tab].icon}</span>
                <span className="hidden sm:inline">{TAB_META[tab].label}</span>
                <span className="text-xs sm:hidden">{TAB_META[tab].label.slice(0, 4)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {lagnaError && (
          <p className="rounded-xl bg-red-500/20 p-4 text-red-200">
            Failed to load chart. Please go back and try again.
          </p>
        )}

        {/* Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent shadow-[0_0_20px_rgba(251,191,36,0.3)]" />
            <p className="text-sm text-white/40">Loading chart…</p>
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

        {/* Saturn tab */}
        {activeTab === 'saturn' && id && (
          <SaturnPanel chartId={id} />
        )}

      </main>
    </div>
  );
}
