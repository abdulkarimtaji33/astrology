'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { DiamondChart, ChartShape } from './LagnaChartSVG';
import AiAnalysisModal, { AiAnalysisResult } from './AiAnalysisModal';
import MahadashaPanel from './MahadashaPanel';

interface AiAnalysisSummary {
  id: number;
  createdAt: string;
  transitFrom: string;
  transitTo: string;
  basis: string;
  model: string;
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface TransitPlanet {
  planet: string;
  sign: string;
  signIndex: number;
  degreeInSign: number;
  house: number;
  isRetrograde: boolean;
  dignity: string[];
}

interface TransitDayData {
  date: string;
  planets: TransitPlanet[];
  houses: { house: number; sign: string; signIndex: number; planets: string[] }[];
}

type PlanetRel = 'own' | 'friendly' | 'enemy' | 'neutral';

interface TransitHouseInfo {
  house: number;
  sign: string;
  signLord: string;
  mainTheme: string;
  represents: string;
  planetRelationships: Record<string, PlanetRel>;
}

interface TransitResponse {
  natalLagna: { longitude: number; sign: string; signIndex: number; degreeInSign: number };
  natalPlanets: TransitPlanet[];
  houseInfo: TransitHouseInfo[];
  from: string;
  to: string;
  days: TransitDayData[];
}

// ─── Form schema ───────────────────────────────────────────────────────────
const today     = new Date().toISOString().slice(0, 10);
const in30Days  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

const schema = z.object({
  from: z.string().min(1, 'Start date required'),
  to:   z.string().min(1, 'End date required'),
}).refine(d => d.from <= d.to, {
  message: 'End date must be after start date',
  path: ['to'],
});
type FormValues = z.infer<typeof schema>;

// ─── Shared maps ───────────────────────────────────────────────────────────
const PLANET_SYMBOL: Record<string, string> = {
  Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀',
  Mars:'♂', Jupiter:'♃', Saturn:'♄', Rahu:'☊', Ketu:'☋',
};

const DIGNITY_BADGE: Record<string, string> = {
  own:         'bg-amber-400/20 text-amber-300',
  exalted:     'bg-emerald-400/20 text-emerald-300',
  debilitated: 'bg-red-400/20 text-red-300',
  neutral:     'bg-white/10 text-white/50',
};

const REL_BADGE: Record<PlanetRel, string> = {
  own:      'bg-amber-400/20 text-amber-300 border-amber-400/30',
  friendly: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  enemy:    'bg-red-500/15 text-red-300 border-red-500/30',
  neutral:  'bg-white/10 text-white/45 border-white/15',
};

// ─── Transit comparison table ──────────────────────────────────────────────
function TransitTable({
  transitPlanets,
  natalPlanets,
  houseInfo,
}: {
  transitPlanets: TransitPlanet[];
  natalPlanets: TransitPlanet[];
  houseInfo: TransitHouseInfo[];
}) {
  const natalMap = new Map(natalPlanets.map(p => [p.planet, p]));
  const houseByNum = new Map(houseInfo.map(h => [h.house, h]));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-white/40">
          Transit vs Natal
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-white/30">
              <th className="px-4 py-2.5">Planet</th>
              <th className="px-3 py-2.5">Transit Sign</th>
              <th className="px-3 py-2.5">Sign Lord</th>
              <th className="px-3 py-2.5">Transit House</th>
              <th className="px-3 py-2.5 min-w-[140px]">House Theme</th>
              <th className="px-3 py-2.5">vs Lord</th>
              <th className="px-3 py-2.5">Natal Sign</th>
              <th className="px-3 py-2.5">Natal House</th>
              <th className="px-3 py-2.5">Dignity</th>
            </tr>
          </thead>
          <tbody>
            {transitPlanets.map(tp => {
              const natal = natalMap.get(tp.planet);
              const signChanged  = natal && tp.sign  !== natal.sign;
              const houseChanged = natal && tp.house !== natal.house;
              const dignityKey   = tp.dignity.includes('exalted')     ? 'exalted'
                : tp.dignity.includes('debilitated') ? 'debilitated'
                : tp.dignity.includes('own')         ? 'own'          : 'neutral';

              const hi = houseByNum.get(tp.house);
              const rel = hi?.planetRelationships?.[tp.planet] ?? 'neutral';

              return (
                <tr key={tp.planet}
                  className="border-b border-white/5 transition hover:bg-white/[0.03]">

                  {/* Planet */}
                  <td className="px-4 py-3 font-medium text-white/90">
                    <span className="mr-2 text-base">{PLANET_SYMBOL[tp.planet] ?? ''}</span>
                    {tp.planet}
                    {tp.isRetrograde && (
                      <span className="ml-1.5 rounded bg-orange-400/20 px-1 py-0.5 text-[10px] text-orange-300">℞</span>
                    )}
                  </td>

                  {/* Transit sign */}
                  <td className="px-3 py-3">
                    <span className={signChanged ? 'text-amber-300 font-medium' : 'text-indigo-300'}>
                      {tp.sign}
                    </span>
                    <span className="ml-2 text-xs tabular-nums text-white/40">
                      {tp.degreeInSign.toFixed(1)}°
                    </span>
                  </td>

                  {/* Sign lord (of transit sign / house cusp) */}
                  <td className="px-3 py-3 text-xs text-cyan-300/90">
                    {hi?.signLord ?? '—'}
                  </td>

                  {/* Transit house */}
                  <td className="px-3 py-3">
                    <span className={houseChanged ? 'text-amber-300 font-semibold tabular-nums' : 'tabular-nums text-white/60'}>
                      H{tp.house}
                    </span>
                  </td>

                  {/* House theme */}
                  <td className="px-3 py-3 max-w-[200px]">
                    <p className="text-xs leading-snug text-white/70 line-clamp-2" title={hi?.represents}>
                      {hi?.mainTheme ?? '—'}
                    </p>
                  </td>

                  {/* Planet vs sign lord (naisargika) */}
                  <td className="px-3 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${REL_BADGE[rel]}`}>
                      {rel}
                    </span>
                  </td>

                  {/* Natal sign */}
                  <td className="px-3 py-3 text-indigo-300/60 tabular-nums">
                    {natal ? (
                      <span>{natal.sign} <span className="text-xs text-white/30">{natal.degreeInSign.toFixed(1)}°</span></span>
                    ) : '—'}
                  </td>

                  {/* Natal house */}
                  <td className="px-3 py-3 tabular-nums text-white/40">
                    {natal ? `H${natal.house}` : '—'}
                  </td>

                  {/* Dignity */}
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${DIGNITY_BADGE[dignityKey]}`}>
                      {dignityKey}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Planet sign-change summary ────────────────────────────────────────────
function SignChangeSummary({ days }: { days: TransitDayData[] }) {
  const [open, setOpen] = useState(false);

  type Change = { planet: string; date: string; from: string; to: string };
  const changes: Change[] = [];

  for (const planet of ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Rahu','Ketu']) {
    let prevSign: string | null = null;
    for (const day of days) {
      const pos = day.planets.find(p => p.planet === planet);
      if (!pos) continue;
      if (prevSign !== null && pos.sign !== prevSign) {
        changes.push({ planet, date: day.date, from: prevSign, to: pos.sign });
      }
      prevSign = pos.sign;
    }
  }

  if (changes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="text-xs font-medium uppercase tracking-widest text-white/40">
          Sign Changes in Range
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] normal-case tabular-nums text-white/40">
            {changes.length}
          </span>
        </span>
        <span className={`text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="flex flex-wrap gap-2 border-t border-white/8 px-5 pb-4 pt-3">
          {changes.map((c, i) => (
            <div key={i}
              className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs">
              <span className="mr-0.5">{PLANET_SYMBOL[c.planet] ?? ''}</span>
              <span className="font-medium text-amber-300">{c.planet}</span>
              <span className="text-white/40">{c.from} → {c.to}</span>
              <span className="text-white/30">{c.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
interface Props {
  chartId: string;
  natalLagna?: { sign: string; signIndex: number; degreeInSign: number; longitude: number };
}

export default function TransitPanel({ chartId, natalLagna }: Props) {
  const [queryParams, setQueryParams] = useState<{ from: string; to: string } | null>(null);
  const [dayIndex, setDayIndex]       = useState(0);
  const [view, setView]               = useState<'chart' | 'table'>('chart');

  const queryClient = useQueryClient();

  // AI analysis state
  const [aiOpen, setAiOpen]           = useState(false);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiError, setAiError]         = useState(false);
  const [aiData, setAiData]           = useState<AiAnalysisResult | null>(null);
  const [aiModalPeriod, setAiModalPeriod] = useState('');

  const openModal = (period: string) => {
    setAiModalPeriod(period);
    setAiData(null);
    setAiError(false);
    setAiOpen(true);
  };

  const handleAiAnalysis = async () => {
    if (!queryParams) return;
    openModal(`${queryParams.from} to ${queryParams.to}`);
    setAiLoading(true);
    try {
      const res = await api.get<AiAnalysisResult>(
        `/birth-records/${chartId}/ai-analysis?from=${queryParams.from}&to=${queryParams.to}`,
        { timeout: 10 * 60 * 1000 },
      );
      setAiData(res.data);
      queryClient.invalidateQueries({ queryKey: ['ai-analyses', chartId] });
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleViewPast = async (item: AiAnalysisSummary) => {
    openModal(`${item.transitFrom} to ${item.transitTo}`);
    setAiLoading(true);
    try {
      const res = await api.get<AiAnalysisResult>(
        `/birth-records/${chartId}/ai-analyses/${item.id}`,
      );
      setAiData(res.data);
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  };

  const { data: analysesList } = useQuery<AiAnalysisSummary[]>({
    queryKey: ['ai-analyses', chartId],
    queryFn: () => api.get<AiAnalysisSummary[]>(`/birth-records/${chartId}/ai-analyses`).then(r => r.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { from: today, to: in30Days },
  });

  const { data, isLoading, isError } = useQuery<TransitResponse>({
    queryKey: ['transits', chartId, queryParams?.from, queryParams?.to],
    queryFn: () =>
      api
        .get<TransitResponse>(
          `/birth-records/${chartId}/transits?from=${queryParams!.from}&to=${queryParams!.to}`,
        )
        .then(r => r.data),
    enabled: !!queryParams,
  });

  const onSubmit = (values: FormValues) => {
    setQueryParams({ from: values.from, to: values.to });
    setDayIndex(0);
  };

  const selectedDay = data?.days[dayIndex];
  const transitChartShape: ChartShape | null =
    selectedDay && data
      ? {
          lagna:   { sign: data.natalLagna.sign },
          houses:  selectedDay.houses,
          planets: selectedDay.planets,
        }
      : null;

  return (
    <div className="flex flex-col gap-6">

      <AiAnalysisModal
        isOpen={aiOpen}
        isLoading={aiLoading}
        isError={aiError}
        data={aiData}
        transitPeriod={aiModalPeriod}
        onClose={() => setAiOpen(false)}
      />

      {/* ── Date range form ── */}
      <form onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 backdrop-blur-md">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-white/40">
          Select Date Range
        </p>
        <div className="flex flex-wrap items-end gap-4">
          {/* From */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">From</label>
            <input
              type="date"
              {...register('from')}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90
                         focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/40
                         [color-scheme:dark]"
            />
            {errors.from && <p className="text-xs text-red-400">{errors.from.message}</p>}
          </div>

          {/* To */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">To</label>
            <input
              type="date"
              {...register('to')}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90
                         focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/40
                         [color-scheme:dark]"
            />
            {errors.to && <p className="text-xs text-red-400">{errors.to.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900
                       transition hover:bg-amber-300 disabled:opacity-50">
            {isLoading ? 'Loading…' : 'Calculate'}
          </button>
        </div>
      </form>

      {/* ── Error ── */}
      {isError && (
        <p className="rounded-xl bg-red-500/20 p-4 text-sm text-red-200">
          Failed to load transit data. Please try again.
        </p>
      )}

      {/* ── Spinner ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        </div>
      )}

      {/* ── Results ── */}
      {data && !isLoading && (
        <>
          {/* Analyze with AI + history */}
          <div className="rounded-2xl border border-violet-400/15 bg-violet-500/5 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-medium uppercase tracking-widest text-violet-300/50">
                AI Analysis
              </p>
              <button
                type="button"
                onClick={handleAiAnalysis}
                className="flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/15 px-5 py-2 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/25 hover:border-violet-400/60 hover:text-violet-200 active:scale-95"
              >
                <span className="text-base">✦</span>
                Analyze with AI
              </button>
            </div>

            {/* Past analyses list */}
            {analysesList && analysesList.length > 0 && (
              <div className="mt-4 flex flex-col gap-1.5">
                <p className="mb-1 text-[11px] uppercase tracking-widest text-white/25">Past Analyses</p>
                {analysesList.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5"
                  >
                    <div className="flex items-center gap-4 text-xs">
                      <span className="tabular-nums text-white/50">
                        {new Date(item.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}{' '}
                        <span className="text-white/30">
                          {new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-white/40">
                        {item.transitFrom} → {item.transitTo}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 capitalize text-white/30">
                        {item.basis}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewPast(item)}
                      className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 transition hover:bg-violet-500/20"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mahadasha */}
          <MahadashaPanel chartId={chartId} />

          {/* Sign change summary */}
          <SignChangeSummary days={data.days} />

          {/* Date slider */}
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-white/40">Date</p>
              <span className="rounded-md bg-white/10 px-3 py-1 text-sm font-medium text-amber-300">
                {selectedDay?.date}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={data.days.length - 1}
              value={dayIndex}
              onChange={e => setDayIndex(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="mt-1 flex justify-between text-[11px] text-white/30">
              <span>{data.from}</span>
              <span>{data.to}</span>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 self-start rounded-lg border border-white/10 bg-white/5 p-1">
            {(['chart', 'table'] as const).map(v => (
              <button key={v} type="button" onClick={() => setView(v)}
                className={[
                  'px-4 py-1.5 rounded-md text-xs font-medium transition capitalize',
                  view === v ? 'bg-amber-400 text-slate-900' : 'text-white/60 hover:text-white/90',
                ].join(' ')}>
                {v === 'chart' ? 'Transit Chart' : 'Compare Table'}
              </button>
            ))}
          </div>

          {/* Chart view */}
          {view === 'chart' && transitChartShape && selectedDay && (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

              {/* Transit diamond chart */}
              <div className="flex flex-col gap-3 lg:w-[420px] lg:shrink-0">
                <div className="w-full rounded-2xl border border-cyan-400/20 bg-white/5 p-4 shadow-xl backdrop-blur-md">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-xs font-medium uppercase tracking-widest text-cyan-400/60">
                      Transit Chart
                    </span>
                    <span className="text-xs text-white/30">{selectedDay.date}</span>
                  </div>
                  <DiamondChart chart={transitChartShape} />
                </div>
                <p className="text-center text-xs text-white/30">
                  Houses from Moon sign (Chandra Lagna){' '}
                  <span className="text-white/50">({data.natalLagna.sign})</span>
                </p>
              </div>

              {/* Quick planet sign list */}
              <div className="flex-1 min-w-0 rounded-2xl border border-white/10 bg-white/5 px-5 py-5 backdrop-blur-md">
                <p className="mb-4 text-xs font-medium uppercase tracking-widest text-white/40">
                  Transit Positions — {selectedDay.date}
                </p>
                <div className="flex flex-col gap-2">
                  {selectedDay.planets.map(p => {
                    const dignityKey = p.dignity.includes('exalted')     ? 'exalted'
                      : p.dignity.includes('debilitated') ? 'debilitated'
                      : p.dignity.includes('own')         ? 'own'          : 'neutral';
                    return (
                      <div key={p.planet}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-white/70">{PLANET_SYMBOL[p.planet] ?? ''}</span>
                          <span className="text-sm font-medium text-white/85">{p.planet}</span>
                          {p.isRetrograde && (
                            <span className="rounded bg-orange-400/20 px-1 py-0.5 text-[10px] text-orange-300">℞</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-indigo-300">{p.sign}</span>
                          <span className="tabular-nums text-white/40">{p.degreeInSign.toFixed(1)}°</span>
                          <span className="text-white/35">H{p.house}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${DIGNITY_BADGE[dignityKey]}`}>
                            {dignityKey}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Table view */}
          {view === 'table' && selectedDay && (
            <TransitTable
              transitPlanets={selectedDay.planets}
              natalPlanets={data.natalPlanets}
              houseInfo={data.houseInfo ?? []}
            />
          )}
        </>
      )}
    </div>
  );
}
