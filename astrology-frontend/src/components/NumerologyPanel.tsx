'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Types (mirror backend NumerologyResult) ──────────────────────────────
interface LoShuCell {
  number:  number;
  count:   number;
  present: boolean;
}

interface NumerologyResult {
  driverNumber:    number;
  conductorNumber: number;
  personalYear:    number;
  targetYear:      number;
  digitCount:      Record<number, number>;
  loShuGrid:       LoShuCell[][];
  driverMeaning:    { title: string; keywords: string };
  conductorMeaning: { title: string; keywords: string };
  personalYearMeaning: { title: string; keywords: string };
  name:              string;
  nameCompound:      number;
  nameNumber:        number;
  nameNumberMeaning: { title: string; keywords: string };
}

// ─── Lo Shu Grid ──────────────────────────────────────────────────────────
function LoShuGrid({ grid }: { grid: LoShuCell[][] }) {
  return (
    <div className="flex flex-col gap-1">
      {grid.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map(cell => (
            <div
              key={cell.number}
              className={[
                'relative flex h-20 w-20 flex-col items-center justify-center rounded-xl border transition',
                cell.present
                  ? 'border-amber-400/50 bg-amber-400/10 shadow-[0_0_16px_rgba(251,191,36,0.12)]'
                  : 'border-slate-200/80 dark:border-white/8 bg-slate-50/90 dark:bg-white/[0.03]',
              ].join(' ')}>

              {/* Main number */}
              <span className={[
                'text-3xl font-bold leading-none tabular-nums',
                cell.present ? 'text-amber-300' : 'text-slate-300 dark:text-white/15',
              ].join(' ')}>
                {cell.number}
              </span>

              {/* Dot indicators for count */}
              {cell.present && (
                <div className="mt-1.5 flex gap-0.5">
                  {Array.from({ length: Math.min(cell.count, 5) }).map((_, i) => (
                    <span key={i}
                      className="h-1.5 w-1.5 rounded-full bg-amber-400/70" />
                  ))}
                  {cell.count > 5 && (
                    <span className="text-[9px] text-amber-400/60">+</span>
                  )}
                </div>
              )}

              {/* Count badge if > 1 */}
              {cell.count > 1 && (
                <span className="absolute right-1.5 top-1.5 rounded bg-amber-400/25 px-1 text-[9px] font-bold text-amber-300">
                  ×{cell.count}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}


// ─── Missing numbers summary ──────────────────────────────────────────────
function MissingNumbers({ digitCount }: { digitCount: Record<number, number> }) {
  const missing = [1,2,3,4,5,6,7,8,9].filter(n => digitCount[n] === 0);
  if (missing.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-white/5 px-5 py-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">
        Missing Numbers
      </p>
      <div className="flex flex-wrap gap-2">
        {missing.map(n => (
          <span key={n}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-white/5 font-bold text-slate-500 dark:text-white/35">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Planes of expression ────────────────────────────────────────────────
// Rows / cols / diagonals of Lo Shu have meanings
function PlanesTable({ grid }: { grid: LoShuCell[][] }) {
  const flat = grid.flat();
  const cell = (n: number) => flat.find(c => c.number === n)!;

  const planes = [
    { name: 'Thought Plane',  numbers: [4,9,2] },
    { name: 'Will Plane',     numbers: [3,5,7] },
    { name: 'Action Plane',   numbers: [8,1,6] },
    { name: 'Mind Plane',     numbers: [4,3,8] },
    { name: 'Soul Plane',     numbers: [9,5,1] },
    { name: 'Physical Plane', numbers: [2,7,6] },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-white/5 overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">Planes of Expression</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/90 dark:border-white/10 text-left text-[11px] uppercase tracking-wider text-slate-400 dark:text-white/25">
              <th className="px-5 py-2">Plane</th>
              <th className="px-3 py-2">Numbers</th>
              <th className="px-3 py-2">Present</th>
              <th className="px-3 py-2">Strength</th>
            </tr>
          </thead>
          <tbody>
            {planes.map(p => {
              const presentCount = p.numbers.filter(n => cell(n).present).length;
              const pct = Math.round((presentCount / p.numbers.length) * 100);
              return (
                <tr key={p.name} className="border-b border-slate-200/70 dark:border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-2.5 font-medium text-slate-800 dark:text-white/80">{p.name}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      {p.numbers.map(n => (
                        <span key={n}
                          className={[
                            'flex h-6 w-6 items-center justify-center rounded text-xs font-bold',
                            cell(n).present
                              ? 'bg-amber-400/20 text-amber-300'
                              : 'bg-white/85 dark:bg-white/5 text-slate-400 dark:text-white/20',
                          ].join(' ')}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-600 dark:text-white/60">
                    {presentCount}/{p.numbers.length}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full bg-amber-400/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-slate-500 dark:text-white/40">{pct}%</span>
                    </div>
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

// ─── Main component ────────────────────────────────────────────────────────
export default function NumerologyPanel({ chartId }: { chartId: string }) {
  const { data, isLoading, isError } = useQuery<NumerologyResult>({
    queryKey: ['numerology', chartId],
    queryFn: () => api.get<NumerologyResult>(`/birth-records/${chartId}/numerology`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="rounded-xl bg-red-500/20 p-4 text-sm text-red-200">
        Failed to load numerology data.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Top row: Lo Shu Grid + number cards ── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* Lo Shu Grid */}
        <div className="flex flex-col gap-3 lg:shrink-0">
          <div className="rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-5 backdrop-blur-md">
            <p className="mb-4 border-l-2 border-amber-400/50 pl-3 text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">
              Lo Shu Grid
            </p>
            <LoShuGrid grid={data.loShuGrid} />
          </div>
          <MissingNumbers digitCount={data.digitCount} />
        </div>

        {/* Number summary */}
        <div className="flex flex-1 flex-col gap-3">
          {[
            { label: 'Driver Number',    value: data.driverNumber,    color: 'text-amber-300',   border: 'border-amber-400/30',   bg: 'bg-gradient-to-b from-amber-400/10 to-amber-400/5',   meaning: data.driverMeaning    },
            { label: 'Conductor Number', value: data.conductorNumber, color: 'text-indigo-300',  border: 'border-indigo-400/30',  bg: 'bg-gradient-to-b from-indigo-400/10 to-indigo-400/5',  meaning: data.conductorMeaning },
            { label: `Personal Year ${data.targetYear}`, value: data.personalYear, color: 'text-emerald-300', border: 'border-emerald-400/30', bg: 'bg-gradient-to-b from-emerald-400/10 to-emerald-400/5', meaning: data.personalYearMeaning },
          ].map(item => (
            <div key={item.label}
              className={`flex items-start gap-5 rounded-2xl border ${item.border} ${item.bg} px-6 py-4`}>
              <span className={`text-5xl font-bold tabular-nums leading-none shrink-0 pt-1 ${item.color}`}>
                {item.value}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">{item.label}</p>
                {item.meaning?.title && (
                  <p className={`mt-1 text-sm font-semibold ${item.color}`}>{item.meaning.title}</p>
                )}
                {item.meaning?.keywords && (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-white/50">{item.meaning.keywords}</p>
                )}
              </div>
            </div>
          ))}

          {/* Name number (Chaldean) */}
          <div className="flex items-start gap-5 rounded-2xl border border-violet-400/30 bg-gradient-to-b from-violet-400/10 to-violet-400/5 px-6 py-4">
            <span className="text-5xl font-bold tabular-nums leading-none shrink-0 pt-1 text-violet-300">
              {data.nameNumber}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">
                Name Number · Chaldean
              </p>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-white/25">
                {data.name}
                <span className="ml-2 tabular-nums text-violet-400/60">
                  (total {data.nameCompound})
                </span>
              </p>
              {data.nameNumberMeaning?.title && (
                <p className="mt-1 text-sm font-semibold text-violet-300">{data.nameNumberMeaning.title}</p>
              )}
              {data.nameNumberMeaning?.keywords && (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-white/50">{data.nameNumberMeaning.keywords}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Planes of expression ── */}
      <PlanesTable grid={data.loShuGrid} />

    </div>
  );
}
