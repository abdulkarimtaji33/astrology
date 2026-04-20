'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

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
  rising:  'Rising (12th)',
  peak:    'Peak (1st / Moon Sign)',
  setting: 'Setting (2nd)',
};

const HOUSE_LABEL: Record<number, string> = {
  12: '12th',
  1:  '1st',
  2:  '2nd',
  4:  '4th',
  8:  '8th',
};

function progressPercent(start: string, end: string): number {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface Props { chartId: string; }

export default function SaturnPanel({ chartId }: Props) {
  const { data, isLoading, isError } = useQuery<SaturnTransitResult>({
    queryKey: ['saturn-transits', chartId],
    queryFn: () => api.get(`/birth-records/${chartId}/saturn-transits`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="rounded-xl bg-red-500/20 p-4 text-red-200">Failed to load Saturn transit data.</p>;
  }

  const { natalMoonSign, periods, currentPeriod, isInSadeSati, isInDhaiyya } = data;

  const sadeSatiPeriods = periods.filter(p => p.type === 'sade-sati');
  const dhaiyyaPeriods  = periods.filter(p => p.type === 'dhaiyya');

  return (
    <div className="flex flex-col gap-6">
      {/* Status banner */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/40">Natal Moon Sign</p>
            <p className="mt-1 text-xl font-semibold text-amber-300">{natalMoonSign}</p>
          </div>
          <div className="flex flex-wrap gap-3 ml-auto">
            <StatusBadge
              label="Sade Sati"
              active={isInSadeSati}
              activeClass="border-red-400/40 bg-red-500/15 text-red-300"
              inactiveClass="border-white/10 bg-white/5 text-white/40"
            />
            <StatusBadge
              label="Dhaiyya (Kantaka Shani)"
              active={isInDhaiyya}
              activeClass="border-orange-400/40 bg-orange-500/15 text-orange-300"
              inactiveClass="border-white/10 bg-white/5 text-white/40"
            />
          </div>
        </div>

        {currentPeriod && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-white/40 mb-2">Currently Active</p>
            <PeriodCard period={currentPeriod} highlight />
          </div>
        )}

        {!currentPeriod && (
          <p className="mt-4 text-sm text-white/40 italic">Not currently in Sade Sati or Dhaiyya.</p>
        )}
      </div>

      {/* Sade Sati */}
      <Section title="Sade Sati" subtitle="Saturn transiting 12th, 1st, and 2nd from Moon — 7.5-year cycle">
        {sadeSatiPeriods.length === 0
          ? <p className="text-sm text-white/40 italic">No Sade Sati periods in the ±30 year window.</p>
          : sadeSatiPeriods.map((p, i) => <PeriodCard key={i} period={p} />)
        }
      </Section>

      {/* Dhaiyya */}
      <Section title="Dhaiyya (Kantaka Shani)" subtitle="Saturn transiting 4th or 8th from Moon — ~2.5 years each">
        {dhaiyyaPeriods.length === 0
          ? <p className="text-sm text-white/40 italic">No Dhaiyya periods in the ±30 year window.</p>
          : dhaiyyaPeriods.map((p, i) => <PeriodCard key={i} period={p} />)
        }
      </Section>

      {/* Info note */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/40 leading-relaxed">
        <strong className="text-white/60">Sade Sati</strong> is a 7½-year period when Saturn transits through the sign before, the natal Moon sign, and the sign after. Each phase is ~2½ years.<br />
        <strong className="text-white/60 mt-2 block">Dhaiyya (Kantaka Shani)</strong> occurs when Saturn transits the 4th or 8th house from natal Moon — each episode lasts ~2½ years and is considered challenging.
      </div>
    </div>
  );
}

function StatusBadge({ label, active, activeClass, inactiveClass }: {
  label: string; active: boolean; activeClass: string; inactiveClass: string;
}) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${active ? activeClass : inactiveClass}`}>
      {active ? '● ' : '○ '}{label}
    </span>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <h3 className="text-base font-semibold text-white/90">{title}</h3>
      <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function PeriodCard({ period, highlight = false }: { period: SaturnPeriod; highlight?: boolean }) {
  const isSadeSati = period.type === 'sade-sati';
  const pct = period.isActive ? progressPercent(period.startDate, period.endDate) : null;
  const houseLabel = period.houseFromMoon === 1 ? '1st (Moon Sign)'
    : HOUSE_LABEL[period.houseFromMoon] ?? `${period.houseFromMoon}th`;

  const borderColor = period.isActive
    ? isSadeSati ? 'border-red-400/40' : 'border-orange-400/40'
    : period.isPast ? 'border-white/5' : 'border-white/10';
  const bgColor = period.isActive
    ? isSadeSati ? 'bg-red-500/10' : 'bg-orange-500/10'
    : 'bg-white/3';

  return (
    <div className={`rounded-xl border p-4 ${borderColor} ${bgColor} ${period.isPast ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isSadeSati ? 'text-red-300' : 'text-orange-300'}`}>
              ♄ {period.saturnSign}
            </span>
            <span className="text-xs text-white/40">· House {houseLabel} from Moon</span>
            {period.isActive && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isSadeSati ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'}`}>
                ACTIVE
              </span>
            )}
            {!period.isActive && !period.isPast && (
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">UPCOMING</span>
            )}
          </div>
          {isSadeSati && period.phase && (
            <p className="mt-0.5 text-xs text-white/50">Phase: {PHASE_LABEL[period.phase]}</p>
          )}
        </div>
        <div className="text-right text-xs text-white/50 tabular-nums">
          <div>{fmt(period.startDate)}</div>
          <div className="text-white/30">to</div>
          <div>{fmt(period.endDate)}</div>
        </div>
      </div>

      {pct !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-white/40 mb-1">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${isSadeSati ? 'bg-red-400' : 'bg-orange-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
