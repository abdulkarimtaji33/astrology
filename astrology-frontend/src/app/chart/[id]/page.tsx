'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import LagnaChartSVG from '@/components/LagnaChartSVG';
import PlanetTable from '@/components/PlanetTable';
import HouseTable, { HouseDetail } from '@/components/HouseTable';
import TransitPanel from '@/components/TransitPanel';
import NumerologyPanel from '@/components/NumerologyPanel';

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

type ChartTab  = 'lagna' | 'moon' | 'transit' | 'numerology';
type TableView = 'houses' | 'planets';

// ─── Shared chart + table layout ───────────────────────────────────────────
function ChartSection({
  chart,
  lagnaLabel,
  lagnaSubLabel,
}: {
  chart: ChartData;
  lagnaLabel: string;
  lagnaSubLabel: string;
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
          ? <HouseTable houses={chart.houseDetails} />
          : <PlanetTable planets={chart.planets} />}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function ChartPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ChartTab>('lagna');

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

  const TAB_META: Record<ChartTab, { label: string; desc: string }> = {
    lagna:      { label: 'Lagna',      desc: 'D1 · Lahiri Ayanamsa · Whole Sign Houses' },
    moon:       { label: 'Moon',       desc: 'Chandra Lagna · Moon as Ascendant' },
    transit:    { label: 'Transit',    desc: 'Planetary Transits · Relative to Natal Lagna' },
    numerology: { label: 'Numerology', desc: 'Lo Shu Grid · Driver · Conductor · Personal Year' },
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

        {/* header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Vedic Birth Chart
            </h1>
            <p className="mt-1 text-sm text-white/50">{TAB_META[activeTab].desc}</p>
          </div>
          <a href="/"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10">
            ← New Chart
          </a>
        </div>

        {/* Tab bar */}
        <div className="mb-8 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
          {(['lagna', 'moon', 'transit', 'numerology'] as ChartTab[]).map(tab => (
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
        {activeTab === 'lagna' && lagnaChart && !lagnaLoading && (
          <ChartSection
            chart={lagnaChart}
            lagnaLabel="Lagna"
            lagnaSubLabel={`Ayanamsa ${lagnaChart.ayanamsa.toFixed(4)}°`}
          />
        )}

        {/* Moon tab */}
        {activeTab === 'moon' && moonChart && !moonLoading && (
          <ChartSection
            chart={moonChart}
            lagnaLabel="Chandra Lagna"
            lagnaSubLabel={`Ayanamsa ${moonChart.ayanamsa.toFixed(4)}°`}
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

      </main>
    </div>
  );
}
