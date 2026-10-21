'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, SectionHeader, Tag } from './placement-ui';

type SaturnPeriodType = 'sade-sati' | 'dhaiyya';
type SadeSatiPhase = 'rising' | 'peak' | 'setting';

interface SaturnPeriod {
  type: SaturnPeriodType;
  phase?: SadeSatiPhase;
  saturnSign: string;
  houseFromMoon: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isPast: boolean;
}

interface SaturnTransitResult {
  natalMoonSign: string;
  natalMoonSignIndex: number;
  periods: SaturnPeriod[];
  currentPeriod: SaturnPeriod | null;
  isInSadeSati: boolean;
  isInDhaiyya: boolean;
}

const PHASE_LABEL: Record<SadeSatiPhase, string> = {
  rising: 'Rising phase',
  peak: 'Peak phase',
  setting: 'Setting phase',
};

const ORD: Record<number, string> = { 1: '1st', 2: '2nd', 4: '4th', 8: '8th', 12: '12th' };

function progressPercent(start: string, end: string): number {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const fmtLong = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** "in 2 years 10 months" / "in 5 months" */
function until(d: string): string {
  const months = Math.max(0, Math.round((new Date(d).getTime() - Date.now()) / (30.44 * 86400000)));
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (!y) return `in ${m} month${m === 1 ? '' : 's'}`;
  return `in ${y} year${y === 1 ? '' : 's'}${m ? ` ${m} month${m === 1 ? '' : 's'}` : ''}`;
}

const periodName = (p: SaturnPeriod) =>
  p.type === 'sade-sati' ? `Sade Sati · ${p.phase ? PHASE_LABEL[p.phase] : ''}` : 'Dhaiyya (Kantaka Shani)';

interface Props { chartId: string; }

export default function SaturnPanel({ chartId }: Props) {
  const { data, isLoading, isError } = useQuery<SaturnTransitResult>({
    queryKey: ['saturn-transits', chartId],
    queryFn: () => api.get(`/birth-records/${chartId}/saturn-transits`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="skeleton h-40" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p role="alert" className="rounded-xl border border-red-300/60 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200">
        Failed to load Saturn transit data.
      </p>
    );
  }

  const { natalMoonSign, periods, currentPeriod } = data;
  const next = periods
    .filter(p => !p.isPast && !p.isActive)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  return (
    <div className="flex flex-col gap-6">
      {/* The one question people come here for: "am I in Sade Sati?" */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="gold">Moon sign: {natalMoonSign}</Tag>
        </div>
        {currentPeriod ? (
          <div>
            <p className="eyebrow">Right now</p>
            <p className="mt-1 text-2xl font-semibold">
              {currentPeriod.type === 'sade-sati' ? 'You are in Sade Sati' : 'You are in Dhaiyya'}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-white/60">
              {periodName(currentPeriod)} · Saturn in {currentPeriod.saturnSign} ({ORD[currentPeriod.houseFromMoon] ?? `${currentPeriod.houseFromMoon}th`} from Moon)
            </p>
            <Progress period={currentPeriod} />
          </div>
        ) : (
          <div>
            <p className="eyebrow">Right now</p>
            <p className="mt-1 text-2xl font-semibold">Not in Sade Sati or Dhaiyya</p>
          </div>
        )}
        {next && (
          <div className="rounded-xl bg-slate-500/[0.07] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/45">Next up</p>
            <p className="mt-0.5 font-semibold">{periodName(next)}</p>
            <p className="text-sm text-slate-600 dark:text-white/60">
              Starts {fmtLong(next.startDate)} <span className="text-amber-700 dark:text-amber-300">({until(next.startDate)})</span>
            </p>
          </div>
        )}
      </Card>

      <Timeline
        title="Sade Sati"
        subtitle="7½ years · Saturn in the 12th, 1st and 2nd sign from your Moon"
        periods={periods.filter(p => p.type === 'sade-sati')}
      />
      <Timeline
        title="Dhaiyya (Kantaka Shani)"
        subtitle="~2½ years · Saturn in the 4th or 8th sign from your Moon"
        periods={periods.filter(p => p.type === 'dhaiyya')}
      />

      <details className="app-card rounded-2xl p-4 text-sm" style={{ border: '1px solid var(--app-border)' }}>
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between font-semibold">
          What do these mean? <span aria-hidden>▾</span>
        </summary>
        <div className="mt-2 space-y-2 text-slate-600 dark:text-white/60">
          <p>
            <strong>Sade Sati</strong> is a 7½-year period when Saturn passes through the sign before your Moon sign, your Moon
            sign itself, and the sign after. Each phase lasts about 2½ years.
          </p>
          <p>
            <strong>Dhaiyya (Kantaka Shani)</strong> happens when Saturn passes through the 4th or 8th sign from your Moon. Each
            episode lasts about 2½ years and is traditionally considered challenging.
          </p>
        </div>
      </details>
    </div>
  );
}

function Progress({ period }: { period: SaturnPeriod }) {
  const pct = progressPercent(period.startDate, period.endDate);
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-white/50">
        <span>{fmtLong(period.startDate)}</span>
        <span className="font-semibold">{pct}% done</span>
        <span>{fmtLong(period.endDate)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-500/15">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-red-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Timeline({ title, subtitle, periods }: { title: string; subtitle: string; periods: SaturnPeriod[] }) {
  const [showPast, setShowPast] = useState(false);
  const past = periods.filter(p => p.isPast);
  const rest = periods.filter(p => !p.isPast);
  const shown = showPast ? [...past, ...rest] : rest;

  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} />
      <Card className="!p-2">
        {past.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPast(s => !s)}
            className="flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-amber-700 hover:bg-amber-400/10 dark:text-amber-300"
          >
            {showPast ? 'Hide past periods' : `Show ${past.length} past period${past.length === 1 ? '' : 's'}`}
          </button>
        )}
        {shown.length === 0 ? (
          <p className="p-3 text-sm text-slate-500 dark:text-white/45">No periods in the next 30 years.</p>
        ) : (
          <ol className="flex flex-col">
            {shown.map(p => (
              <li
                key={`${p.startDate}-${p.saturnSign}-${p.houseFromMoon}`}
                className={[
                  'flex items-center gap-3 rounded-xl px-3 py-2.5',
                  p.isActive ? 'bg-amber-400/10 ring-1 ring-inset ring-amber-400/40' : '',
                  p.isPast ? 'opacity-55' : '',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.isActive ? 'bg-amber-400' : p.isPast ? 'bg-slate-400/50' : 'bg-indigo-400'}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    ♄ {p.saturnSign}
                    <span className="font-normal text-slate-500 dark:text-white/50">
                      {' '}· {p.phase ? PHASE_LABEL[p.phase] : `${ORD[p.houseFromMoon] ?? p.houseFromMoon} from Moon`}
                    </span>
                  </span>
                  <span className="block text-xs tabular-nums text-slate-500 dark:text-white/50">
                    {fmt(p.startDate)} – {fmt(p.endDate)}
                  </span>
                </span>
                {p.isActive ? <Tag tone="gold">Now</Tag> : !p.isPast ? <Tag tone="violet">{until(p.startDate)}</Tag> : null}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
  );
}
