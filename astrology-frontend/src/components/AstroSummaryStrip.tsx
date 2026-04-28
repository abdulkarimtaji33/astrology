'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface DashaPeriod {
  planet: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
interface MahadashaResult {
  moonNakshatra: string;
  periods: DashaPeriod[];
}
interface NumerologyResult {
  personalYear: number;
  targetYear: number;
  driverNumber: number;
}
interface SaturnResult {
  isInSadeSati: boolean;
  isInDhaiyya: boolean;
  currentPeriod: { type: string; phase?: string; startDate: string; endDate: string } | null;
}

const PLANET_SYMBOL: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};
const PLANET_COLOR_TEXT: Record<string, string> = {
  Sun: 'text-amber-500 dark:text-amber-300',
  Moon: 'text-slate-500 dark:text-slate-200',
  Mars: 'text-red-500 dark:text-red-400',
  Mercury: 'text-emerald-600 dark:text-emerald-300',
  Jupiter: 'text-yellow-600 dark:text-yellow-300',
  Venus: 'text-pink-500 dark:text-pink-300',
  Saturn: 'text-indigo-600 dark:text-indigo-300',
  Rahu: 'text-purple-600 dark:text-purple-300',
  Ketu: 'text-orange-500 dark:text-orange-300',
};

export default function AstroSummaryStrip({ chartId }: { chartId: string }) {
  const { data: maha } = useQuery<MahadashaResult>({
    queryKey: ['mahadasha', chartId],
    queryFn: () => api.get<MahadashaResult>(`/birth-records/${chartId}/mahadasha`).then(r => r.data),
  });
  const { data: num } = useQuery<NumerologyResult>({
    queryKey: ['numerology', chartId],
    queryFn: () => api.get<NumerologyResult>(`/birth-records/${chartId}/numerology`).then(r => r.data),
  });
  const { data: saturn } = useQuery<SaturnResult>({
    queryKey: ['saturn-transits', chartId],
    queryFn: () => api.get<SaturnResult>(`/birth-records/${chartId}/saturn-transits`).then(r => r.data),
  });

  const currentDasha = maha?.periods.find(p => p.isCurrent);
  const dashaColor = currentDasha
    ? (PLANET_COLOR_TEXT[currentDasha.planet] ?? 'text-slate-700 dark:text-white/80')
    : 'text-slate-500 dark:text-white/40';

  const saturnActive = saturn?.isInSadeSati || saturn?.isInDhaiyya;
  const saturnLabel = saturn?.isInSadeSati ? 'Sade Sati' : saturn?.isInDhaiyya ? 'Dhaiyya' : 'Neither';
  const saturnPhase = saturn?.currentPeriod?.phase
    ? ` · ${saturn.currentPeriod.phase.charAt(0).toUpperCase() + saturn.currentPeriod.phase.slice(1)}`
    : '';

  const chip = 'flex items-center gap-2.5 rounded-xl border px-4 py-2.5';
  const chipDefault = 'border-slate-200/90 bg-white/80 dark:border-white/[0.1] dark:bg-white/[0.04]';

  return (
    <div className="flex flex-wrap gap-2.5">
      {/* Mahadasha */}
      <div className={`${chip} ${chipDefault}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base dark:bg-white/8">
          {currentDasha ? (PLANET_SYMBOL[currentDasha.planet] ?? '♄') : '…'}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30">Mahadasha</p>
          {currentDasha ? (
            <p className={`text-sm font-semibold leading-tight ${dashaColor}`}>
              {currentDasha.planet} Dasha
              <span className="ml-1.5 text-[11px] font-normal text-slate-400 dark:text-white/30">
                until {currentDasha.endDate.slice(0, 7)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-400 dark:text-white/30">—</p>
          )}
        </div>
      </div>

      {/* Personal Year */}
      <div className={`${chip} ${chipDefault}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-lg font-bold text-emerald-600 tabular-nums dark:bg-emerald-400/10 dark:text-emerald-300">
          {num ? num.personalYear : '…'}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30">Personal Year</p>
          <p className="text-sm font-semibold leading-tight text-emerald-600 dark:text-emerald-300">
            Year {num?.personalYear ?? '—'}
            <span className="ml-1.5 text-[11px] font-normal text-slate-400 dark:text-white/30">
              {num ? `(${num.targetYear})` : ''}
            </span>
          </p>
        </div>
      </div>

      {/* Saturn */}
      <div className={`${chip} ${
        saturnActive
          ? saturn?.isInSadeSati
            ? 'border-red-300/60 bg-red-50/80 dark:border-red-400/30 dark:bg-red-500/10'
            : 'border-orange-300/60 bg-orange-50/80 dark:border-orange-400/30 dark:bg-orange-500/10'
          : chipDefault
      }`}>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${
          saturnActive
            ? saturn?.isInSadeSati
              ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300'
              : 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300'
            : 'bg-slate-100 text-indigo-600 dark:bg-white/8 dark:text-indigo-300'
        }`}>
          ♄
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30">Saturn</p>
          <p className={`text-sm font-semibold leading-tight ${
            saturnActive
              ? saturn?.isInSadeSati
                ? 'text-red-600 dark:text-red-300'
                : 'text-orange-600 dark:text-orange-300'
              : 'text-slate-500 dark:text-white/50'
          }`}>
            {saturn ? saturnLabel + saturnPhase : '…'}
          </p>
        </div>
      </div>
    </div>
  );
}
