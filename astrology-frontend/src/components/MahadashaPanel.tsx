'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface DashaPeriod {
  planet: string;
  startDate: string;
  endDate: string;
  years: number;
  isCurrent: boolean;
}

interface MahadashaResult {
  moonNakshatra: string;
  moonNakshatraIndex: number;
  moonLongitude: number;
  dashaLordAtBirth: string;
  periods: DashaPeriod[];
}

const PLANET_SYMBOL: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const PLANET_COLOR: Record<string, { text: string; border: string; bg: string }> = {
  Sun:     { text: 'text-amber-300',   border: 'border-amber-400/30',   bg: 'bg-amber-400/10'   },
  Moon:    { text: 'text-slate-200',   border: 'border-slate-400/30',   bg: 'bg-slate-400/10'   },
  Mars:    { text: 'text-red-400',     border: 'border-red-400/30',     bg: 'bg-red-400/10'     },
  Mercury: { text: 'text-emerald-300', border: 'border-emerald-400/30', bg: 'bg-emerald-400/10' },
  Jupiter: { text: 'text-yellow-300',  border: 'border-yellow-400/30',  bg: 'bg-yellow-400/10'  },
  Venus:   { text: 'text-pink-300',    border: 'border-pink-400/30',    bg: 'bg-pink-400/10'    },
  Saturn:  { text: 'text-indigo-300',  border: 'border-indigo-400/30',  bg: 'bg-indigo-400/10'  },
  Rahu:    { text: 'text-purple-300',  border: 'border-purple-400/30',  bg: 'bg-purple-400/10'  },
  Ketu:    { text: 'text-orange-300',  border: 'border-orange-400/30',  bg: 'bg-orange-400/10'  },
};

function progressPercent(start: string, end: string): number {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

interface Props {
  chartId: string;
}

export default function MahadashaPanel({ chartId }: Props) {
  const { data, isLoading, isError } = useQuery<MahadashaResult>({
    queryKey: ['mahadasha', chartId],
    queryFn: () => api.get<MahadashaResult>(`/birth-records/${chartId}/mahadasha`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="rounded-xl bg-red-500/20 p-4 text-sm text-red-200">Failed to load Mahadasha.</p>;
  }

  const current = data.periods.find(p => p.isCurrent);
  const pct = current ? progressPercent(current.startDate, current.endDate) : 0;
  const col = current ? (PLANET_COLOR[current.planet] ?? PLANET_COLOR.Saturn) : PLANET_COLOR.Saturn;

  return (
    <div className="flex flex-col gap-4">

      {/* Header card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
          Vimshottari Mahadasha
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-white/40 text-xs">Moon Nakshatra</span>
            <p className="mt-0.5 font-semibold text-amber-300">{data.moonNakshatra}</p>
          </div>
          <div>
            <span className="text-white/40 text-xs">Dasha Lord at Birth</span>
            <p className={`mt-0.5 font-semibold ${PLANET_COLOR[data.dashaLordAtBirth]?.text ?? 'text-white'}`}>
              {PLANET_SYMBOL[data.dashaLordAtBirth]} {data.dashaLordAtBirth}
            </p>
          </div>
          {current && (
            <div>
              <span className="text-white/40 text-xs">Current Mahadasha</span>
              <p className={`mt-0.5 font-semibold ${col.text}`}>
                {PLANET_SYMBOL[current.planet]} {current.planet}
              </p>
            </div>
          )}
        </div>

        {/* Progress bar for current dasha */}
        {current && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-[11px] text-white/35">
              <span>{current.startDate}</span>
              <span className={col.text}>{pct}% elapsed</span>
              <span>{current.endDate}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${col.bg.replace('/10', '/60')}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
          All Periods
        </p>
        <div className="flex flex-col gap-2">
          {data.periods.map((p, i) => {
            const c = PLANET_COLOR[p.planet] ?? PLANET_COLOR.Saturn;
            const pPct = p.isCurrent ? progressPercent(p.startDate, p.endDate) : null;
            return (
              <div
                key={i}
                className={`rounded-xl border px-4 py-3 ${
                  p.isCurrent
                    ? `${c.border} ${c.bg}`
                    : 'border-white/8 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-lg shrink-0 ${c.text}`}>{PLANET_SYMBOL[p.planet]}</span>
                    <span className={`text-sm font-semibold ${p.isCurrent ? c.text : 'text-white/70'}`}>
                      {p.planet}
                    </span>
                    {p.isCurrent && (
                      <span className={`rounded-full border ${c.border} ${c.bg} px-2 py-0.5 text-[10px] font-semibold ${c.text}`}>
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40 shrink-0">
                    <span className="tabular-nums">{p.startDate}</span>
                    <span className="text-white/20">→</span>
                    <span className="tabular-nums">{p.endDate}</span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 tabular-nums">{p.years}y</span>
                  </div>
                </div>
                {pPct !== null && (
                  <div className="mt-2">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${c.bg.replace('/10', '/50')}`}
                        style={{ width: `${pPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
