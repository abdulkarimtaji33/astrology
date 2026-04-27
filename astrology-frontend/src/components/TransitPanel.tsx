'use client';

import { useMemo, useState } from 'react';
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

// ─── Summary strip types ────────────────────────────────────────────────────
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

const PLANET_SYMBOL_SM: Record<string, string> = {
  Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀',
  Mars:'♂', Jupiter:'♃', Saturn:'♄', Rahu:'☊', Ketu:'☋',
};
const PLANET_COLOR_TEXT: Record<string, string> = {
  Sun: 'text-amber-300', Moon: 'text-slate-200', Mars: 'text-red-400',
  Mercury: 'text-emerald-300', Jupiter: 'text-yellow-300', Venus: 'text-pink-300',
  Saturn: 'text-indigo-300', Rahu: 'text-purple-300', Ketu: 'text-orange-300',
};

function AstroSummaryStrip({ chartId }: { chartId: string }) {
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
  const dashaColor   = currentDasha ? (PLANET_COLOR_TEXT[currentDasha.planet] ?? 'text-white/80') : 'text-white/40';

  const saturnActive = saturn?.isInSadeSati || saturn?.isInDhaiyya;
  const saturnLabel  = saturn?.isInSadeSati ? 'Sade Sati' : saturn?.isInDhaiyya ? 'Dhaiyya' : 'Neither';
  const saturnPhase  = saturn?.currentPeriod?.phase
    ? ` · ${saturn.currentPeriod.phase.charAt(0).toUpperCase() + saturn.currentPeriod.phase.slice(1)}`
    : '';

  return (
    <div className="flex flex-wrap gap-3">
      {/* Mahadasha chip */}
      <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.03] px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/8 text-sm">
          {currentDasha ? PLANET_SYMBOL_SM[currentDasha.planet] ?? '♄' : '…'}
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/35">Mahadasha</p>
          {currentDasha ? (
            <p className={`text-sm font-semibold leading-tight ${dashaColor}`}>
              {currentDasha.planet} Dasha
              <span className="ml-1.5 text-[11px] font-normal text-white/35">
                until {currentDasha.endDate.slice(0, 7)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-white/30">—</p>
          )}
        </div>
      </div>

      {/* Personal Year chip */}
      <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.03] px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-lg font-bold text-emerald-300 tabular-nums">
          {num ? num.personalYear : '…'}
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/35">Personal Year</p>
          <p className="text-sm font-semibold leading-tight text-emerald-300">
            Year {num?.personalYear ?? '—'}
            <span className="ml-1.5 text-[11px] font-normal text-white/35">
              {num ? `(${num.targetYear})` : ''}
            </span>
          </p>
        </div>
      </div>

      {/* Saturn chip */}
      <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 ${
        saturnActive
          ? saturn?.isInSadeSati
            ? 'border-red-400/30 bg-gradient-to-b from-red-500/10 to-red-500/5'
            : 'border-orange-400/30 bg-gradient-to-b from-orange-500/10 to-orange-500/5'
          : 'border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.03]'
      }`}>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
          saturnActive
            ? saturn?.isInSadeSati ? 'bg-red-500/15 text-red-300' : 'bg-orange-500/15 text-orange-300'
            : 'bg-white/8 text-indigo-300'
        }`}>
          ♄
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/35">Saturn</p>
          <p className={`text-sm font-semibold leading-tight ${
            saturnActive
              ? saturn?.isInSadeSati ? 'text-red-300' : 'text-orange-300'
              : 'text-white/50'
          }`}>
            {saturn ? saturnLabel + saturnPhase : '…'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Form schema ───────────────────────────────────────────────────────────
const today    = new Date().toISOString().slice(0, 10);
const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

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

const REL_TO_LORD_HINT: Record<PlanetRel, string> = {
  own:      'Own sign — planet is the lord here',
  friendly: 'Friendly toward sign lord',
  enemy:    'Inimical toward sign lord',
  neutral:  'Neutral toward sign lord',
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
    <div className="rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.03] shadow-xl backdrop-blur-md overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="border-l-2 border-amber-400/50 pl-3 text-xs font-medium uppercase tracking-widest text-white/40">
          Transit vs Natal
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-white/30">
              <th className="px-4 py-2.5">Planet</th>
              <th className="px-3 py-2.5 max-w-[150px]">Transit sign · lord</th>
              <th className="px-3 py-2.5">Transit House</th>
              <th className="px-3 py-2.5 min-w-[140px]">House Theme</th>
              <th className="px-3 py-2.5 max-w-[120px]">vs sign lord</th>
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
                  className="border-b border-white/5 transition-colors duration-150 hover:bg-white/[0.05]">
                  <td className="px-4 py-3 font-medium text-white/90">
                    <span className="mr-2 text-lg">{PLANET_SYMBOL[tp.planet] ?? ''}</span>
                    {tp.planet}
                    {tp.isRetrograde && (
                      <span className="ml-1.5 rounded bg-red-400/20 px-1 py-0.5 text-[10px] text-red-300">℞</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span>
                        <span className={signChanged ? 'text-amber-300 font-medium' : 'text-indigo-300'}>
                          {tp.sign}
                        </span>
                        <span className="ml-2 text-xs tabular-nums text-white/40">
                          {tp.degreeInSign.toFixed(1)}°
                        </span>
                      </span>
                      {hi?.signLord && (
                        <span className="text-[10px] text-cyan-400/80">Lord: {hi.signLord}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={houseChanged ? 'text-amber-300 font-semibold tabular-nums' : 'tabular-nums text-white/60'}>
                      H{tp.house}
                    </span>
                  </td>
                  <td className="px-3 py-3 max-w-[200px]">
                    <p className="text-xs leading-snug text-white/70 line-clamp-2" title={hi?.represents}>
                      {hi?.mainTheme ?? '—'}
                    </p>
                  </td>
                  <td className="px-3 py-3 max-w-[120px]">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${REL_BADGE[rel]}`}
                      title={REL_TO_LORD_HINT[rel]}
                    >
                      {rel}
                    </span>
                    {hi?.signLord && (
                      <p className="mt-1 text-[10px] leading-tight text-white/35">
                        {tp.planet} → {hi.signLord}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-indigo-300/60 tabular-nums">
                    {natal ? (
                      <span>{natal.sign} <span className="text-xs text-white/30">{natal.degreeInSign.toFixed(1)}°</span></span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-white/40">
                    {natal ? `H${natal.house}` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] capitalize ${DIGNITY_BADGE[dignityKey]}`}>
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
    <details className="rounded-2xl border border-white/10 bg-white/5">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-xs font-medium uppercase tracking-widest text-white/40">
        <span>
          Sign Changes in Range
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] normal-case tabular-nums text-white/40">
            {changes.length}
          </span>
        </span>
        <span className="text-white/30">▾</span>
      </summary>
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
    </details>
  );
}

// ─── Transit reminder scheduling modal ─────────────────────────────────────
interface ReminderPayload {
  planet: string;
  houseNum: number;
  houseSign?: string;
  houseTheme?: string;
  dateRange: string; // display range string e.g. "1 Jan 2026 → 15 Jan 2026"
  /** ISO first date of range, used as initial sendDate */
  firstIsoDate: string;
}

function ReminderModal({
  payload,
  onClose,
}: {
  payload: ReminderPayload;
  onClose: () => void;
}) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendDate, setSendDate] = useState(payload.firstIsoDate);
  const [subject, setSubject] = useState(
    `Transit reminder: ${payload.planet} in House ${payload.houseNum}${payload.houseSign ? ` (${payload.houseSign})` : ''}`,
  );
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const placementDetails = [
    `Planet: ${payload.planet}`,
    `House: ${payload.houseNum}${payload.houseSign ? ` — ${payload.houseSign}` : ''}`,
    payload.houseTheme ? `Theme: ${payload.houseTheme}` : '',
    `Transit dates: ${payload.dateRange}`,
  ].filter(Boolean).join('\n');

  const offsetDate = (days: number) => {
    const d = new Date(`${payload.firstIsoDate}T12:00:00`);
    d.setDate(d.getDate() - days);
    setSendDate(d.toISOString().slice(0, 10));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !sendDate || !subject) return;
    setStatus('loading');
    try {
      await api.post('/reminders', {
        recipientEmail,
        sendDate,
        subject,
        placementDetails,
        note: note || undefined,
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-indigo-400/20 bg-[#0d0d1c] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-indigo-300">
                Schedule Reminder Email
              </h3>
              <p className="text-[11px] text-white/40 mt-0.5">
                {PLANET_SYMBOL[payload.planet] ?? ''} {payload.planet} · House {payload.houseNum}
                {payload.houseSign ? ` · ${payload.houseSign}` : ''}
              </p>
              <p className="text-[11px] text-indigo-300/60 mt-1 tabular-nums">{payload.dateRange}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/30 hover:text-white/60 text-lg leading-none p-1"
              aria-label="Close"
            >✕</button>
          </div>
        </div>

        {status === 'success' ? (
          <div className="px-5 py-8 text-center flex flex-col items-center gap-3">
            <span className="text-3xl">✅</span>
            <p className="text-sm text-white/80 font-medium">Reminder scheduled!</p>
            <p className="text-[11px] text-white/40">
              An email will be sent to <span className="text-white/60">{recipientEmail}</span> on{' '}
              <span className="text-indigo-300">{formatTransitModalDate(sendDate)}</span>.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-5 py-2 text-xs text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-5 py-4 flex flex-col gap-4">
            {/* Placement preview */}
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Placement details (auto-filled)</p>
              <pre className="text-[11px] text-white/50 whitespace-pre-wrap leading-relaxed font-sans">{placementDetails}</pre>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5">Recipient email</label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder:text-white/25 focus:border-indigo-400/50 focus:outline-none"
              />
            </div>

            {/* Send date + shortcuts */}
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5">Send on date</label>
              <input
                type="date"
                required
                value={sendDate}
                onChange={e => setSendDate(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/90 focus:border-indigo-400/50 focus:outline-none"
              />
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setSendDate(payload.firstIsoDate)}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/50 hover:bg-white/[0.07] hover:text-white/70 transition-colors"
                >
                  On start date
                </button>
                <button
                  type="button"
                  onClick={() => offsetDate(7)}
                  className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1 text-[11px] text-amber-300/70 hover:bg-amber-400/10 transition-colors"
                >
                  −7 days early
                </button>
                <button
                  type="button"
                  onClick={() => offsetDate(15)}
                  className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1 text-[11px] text-amber-300/70 hover:bg-amber-400/10 transition-colors"
                >
                  −15 days early
                </button>
              </div>
              {sendDate && (
                <p className="text-[11px] text-indigo-300/60 mt-1.5">
                  Will send: {formatTransitModalDate(sendDate)}
                </p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder:text-white/25 focus:border-indigo-400/50 focus:outline-none"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5">
                Extra note <span className="text-white/20">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Add any personal notes or instructions..."
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder:text-white/25 focus:border-indigo-400/50 focus:outline-none resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-[11px] text-red-400/80">Failed to schedule reminder. Please try again.</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex-1 rounded-xl border border-indigo-400/40 bg-indigo-500/15 py-2.5 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/25 transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? 'Scheduling…' : 'Schedule Reminder'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/40 hover:bg-white/[0.07] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── House transit history: date ranges helper (sorted unique dates) ───────
/** e.g. "2026-01-01" → "1 Jan 2026" (avoids TZ shift with noon UTC) */
function formatTransitModalDate(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildDateRangesList(dates: string[]): string[] {
  if (dates.length === 0) return [];
  const d = [...new Set(dates)].sort();
  const ranges: string[] = [];
  let rangeStart = d[0];
  let prev = d[0];
  for (let i = 1; i <= d.length; i++) {
    const curr = d[i];
    const prevDate = new Date(prev);
    const currDate = curr ? new Date(curr) : null;
    const isConsecutive = Boolean(
      currDate && currDate.getTime() - prevDate.getTime() <= 86400000 * 1.5,
    );
    if (!isConsecutive) {
      const one =
        rangeStart === prev
          ? formatTransitModalDate(rangeStart)
          : `${formatTransitModalDate(rangeStart)} → ${formatTransitModalDate(prev)}`;
      ranges.push(one);
      if (curr) rangeStart = curr;
    }
    prev = curr ?? prev;
  }
  return ranges;
}

// ─── House transit history modal ───────────────────────────────────────────
interface HouseHistoryEntry {
  planet: string;
  dates: string[];
}

function buildHouseHistoryCopy(
  house: number,
  hi: TransitHouseInfo | undefined,
  allDays: TransitDayData[],
  ignoreMoon: boolean,
): string {
  const from = allDays[0]?.date;
  const to   = allDays[allDays.length - 1]?.date;
  const rangeLine =
    from && to
      ? (from === to ? formatTransitModalDate(from) : `${formatTransitModalDate(from)} — ${formatTransitModalDate(to)}`)
      : '—';

  const countDaysWithRelevant = allDays.filter(d =>
    d.planets.some(p => p.house === house && !(ignoreMoon && p.planet === 'Moon')),
  ).length;

  const map = new Map<string, string[]>();
  for (const day of allDays) {
    for (const p of day.planets) {
      if (p.house !== house) continue;
      if (ignoreMoon && p.planet === 'Moon') continue;
      if (!map.has(p.planet)) map.set(p.planet, []);
      map.get(p.planet)!.push(day.date);
    }
  }
  const lines: string[] = [
    `House ${house}` + (hi?.sign ? ` — ${hi.sign}` : ''),
    hi?.mainTheme ? `Theme: ${hi.mainTheme}` : '',
    `Selected range: ${rangeLine}`,
    `Days with at least one relevant planet in this house: ${countDaysWithRelevant}${
      ignoreMoon ? ' (Moon excluded)' : ''}`,
    '',
  ].filter(Boolean) as string[];

  const names = Array.from(map.keys()).sort();
  for (const planet of names) {
    const dates = map.get(planet)!;
    const ranges = buildDateRangesList(dates);
    lines.push(`${PLANET_SYMBOL[planet] ? `${PLANET_SYMBOL[planet]} ` : ''}${planet} — ${dates.length} day${
      dates.length !== 1 ? 's' : ''}`);
    for (const r of ranges) lines.push(`  ${r}`);
    lines.push('');
  }
  if (names.length === 0) {
    lines.push(ignoreMoon ? 'No other planets in this house in the range (Moon only or empty).' : 'No planets in this house in the range.');
  }
  return lines.join('\n').replace(/\n+$/, '\n');
}

/** Clipboard API is missing or throws on many HTTP / embedded contexts; execCommand works for user-initiated copy. */
function tryCopyTextViaExecCommand(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', 'readonly');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

function HouseHistoryModal({
  house,
  hi,
  allDays,
  onClose,
}: {
  house: number;
  hi: TransitHouseInfo | undefined;
  allDays: TransitDayData[];
  onClose: () => void;
}) {
  const [ignoreMoon, setIgnoreMoon] = useState(false);
  const [copyDone, setCopyDone]   = useState(false);
  const [reminderPayload, setReminderPayload] = useState<ReminderPayload | null>(null);

  const { entries, totalTransits } = useMemo(() => {
    const planetDatesMap = new Map<string, string[]>();
    for (const day of allDays) {
      for (const p of day.planets) {
        if (p.house !== house) continue;
        if (ignoreMoon && p.planet === 'Moon') continue;
        if (!planetDatesMap.has(p.planet)) planetDatesMap.set(p.planet, []);
        planetDatesMap.get(p.planet)!.push(day.date);
      }
    }
    const ent: HouseHistoryEntry[] = Array.from(planetDatesMap.entries())
      .map(([planet, dates]) => ({ planet, dates }))
      .sort((a, b) => a.planet.localeCompare(b.planet));

    const total = allDays.filter(d =>
      d.planets.some(p => p.house === house && !(ignoreMoon && p.planet === 'Moon')),
    ).length;
    return { entries: ent, totalTransits: total };
  }, [allDays, house, ignoreMoon]);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const text = buildHouseHistoryCopy(house, hi, allDays, ignoreMoon);
    if (tryCopyTextViaExecCommand(text)) {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(
        () => {
          setCopyDone(true);
          setTimeout(() => setCopyDone(false), 2000);
        },
        () => { /* */ },
      );
    }
  };

  return (
    <>
    {reminderPayload && (
      <ReminderModal
        payload={reminderPayload}
        onClose={() => setReminderPayload(null)}
      />
    )}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#0f0f1a] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-amber-300">
                House {house} · {hi?.sign ?? ''}
              </h3>
              {hi?.mainTheme && <p className="text-xs text-white/40 mt-0.5">{hi.mainTheme}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={copyToClipboard}
                className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/70 hover:bg-white/10 transition-colors"
              >
                {copyDone ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-white/30 hover:text-white/60 text-lg leading-none transition-colors p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-white/50">
              <input
                type="checkbox"
                checked={ignoreMoon}
                onChange={e => setIgnoreMoon(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/40"
              />
              Ignore Moon (hide Moon rows and days where only Moon is in this house)
            </label>
            <p className="text-[11px] text-white/30">
              {totalTransits} day{totalTransits !== 1 ? 's' : ''} with a planet{ignoreMoon ? ' (excl. Moon)' : ''} in
              this house
            </p>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh] px-5 py-4 flex flex-col gap-4">
          {entries.length === 0 ? (
            <p className="text-xs text-white/30">No matching planets in this house for the selected range.</p>
          ) : (
            entries.map(({ planet, dates }) => {
              const sortedUnique = [...new Set(dates)].sort();
              const ranges = buildDateRangesList(dates);
              // Build per-range first ISO date for reminder scheduling
              const rangeFirstIso: string[] = [];
              {
                let ri = 0;
                for (let i = 0; i < sortedUnique.length; ) {
                  const start = sortedUnique[i];
                  rangeFirstIso[ri] = start;
                  // Skip consecutive dates in this range
                  let j = i + 1;
                  while (
                    j < sortedUnique.length &&
                    new Date(sortedUnique[j]).getTime() - new Date(sortedUnique[j - 1]).getTime() <= 86400000 * 1.5
                  ) j++;
                  i = j;
                  ri++;
                }
              }

              return (
                <div key={planet}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{PLANET_SYMBOL[planet] ?? ''}</span>
                    <span className="text-xs font-medium text-white/80">{planet}</span>
                    <span className="text-[10px] text-white/30 ml-auto">{dates.length} day{dates.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ranges.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        title="Click to schedule a reminder email for this transit"
                        onClick={e => {
                          e.stopPropagation();
                          setReminderPayload({
                            planet,
                            houseNum: house,
                            houseSign: hi?.sign,
                            houseTheme: hi?.mainTheme,
                            dateRange: r,
                            firstIsoDate: rangeFirstIso[i] ?? sortedUnique[0],
                          });
                        }}
                        className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-white/60 tabular-nums hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all duration-150"
                      >
                        {r}
                        <span className="opacity-0 group-hover:opacity-60 text-[10px] transition-opacity">🔔</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
    </>
  );
}

// ─── House view ────────────────────────────────────────────────────────────
function HouseView({
  planets,
  houseInfo,
  natalPlanets,
  date,
  allDays,
}: {
  planets: TransitPlanet[];
  houseInfo: TransitHouseInfo[];
  natalPlanets: TransitPlanet[];
  date: string;
  allDays: TransitDayData[];
}) {
  const [hiddenHouses, setHiddenHouses] = useState<Set<number>>(new Set());
  const [collapsedHouses, setCollapsedHouses] = useState<Set<number>>(new Set());
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);

  const natalMap   = new Map(natalPlanets.map(p => [p.planet, p]));
  const houseByNum = new Map(houseInfo.map(h => [h.house, h]));

  const toggleHouse = (h: number) => {
    setHiddenHouses(prev => {
      const next = new Set(prev);
      if (next.has(h)) next.delete(h); else next.add(h);
      return next;
    });
  };

  const toggleCollapsed = (h: number) => {
    setCollapsedHouses(prev => {
      const next = new Set(prev);
      if (next.has(h)) next.delete(h); else next.add(h);
      return next;
    });
  };

  // Build all 12 houses; within each, sort planets by name
  const allHouses = Array.from({ length: 12 }, (_, i) => i + 1).map(h => ({
    house: h,
    hi: houseByNum.get(h),
    transiting: planets.filter(p => p.house === h).sort((a, b) => a.planet.localeCompare(b.planet)),
  }));

  const selectedHouseInfo = selectedHouse !== null ? houseByNum.get(selectedHouse) : undefined;

  return (
    <>
      {selectedHouse !== null && (
        <HouseHistoryModal
          house={selectedHouse}
          hi={selectedHouseInfo}
          allDays={allDays}
          onClose={() => setSelectedHouse(null)}
        />
      )}

      <div className="rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.03] shadow-xl backdrop-blur-md overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="border-l-2 border-amber-400/50 pl-3 text-xs font-medium uppercase tracking-widest text-white/40">
              Transit by House — {date}
            </h2>
            <p className="mt-1 pl-5 text-[11px] text-white/30">
              Click a row to open transit history · use arrow to expand/collapse · eye hides the row
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {collapsedHouses.size > 0 && (
              <button
                type="button"
                onClick={() => setCollapsedHouses(new Set())}
                className="text-[11px] text-amber-300/60 hover:text-amber-300 transition-colors"
              >
                Expand all
              </button>
            )}
            {hiddenHouses.size > 0 && (
              <button
                type="button"
                onClick={() => setHiddenHouses(new Set())}
                className="text-[11px] text-amber-300/60 hover:text-amber-300 transition-colors"
              >
                Show all
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-white/30">
                <th className="px-4 py-2.5">House</th>
                <th className="px-3 py-2.5 min-w-[140px]">Theme</th>
                <th className="px-3 py-2.5">Planet</th>
                <th className="px-3 py-2.5 max-w-[150px]">Transit Sign · Lord</th>
                <th className="px-3 py-2.5 max-w-[120px]">vs Sign Lord</th>
                <th className="px-3 py-2.5">Natal Sign</th>
                <th className="px-3 py-2.5">Natal House</th>
                <th className="px-3 py-2.5">Dignity</th>
              </tr>
            </thead>
            <tbody>
              {allHouses.map(({ house, hi, transiting }) => {
                const isHidden = hiddenHouses.has(house);
                const isEmpty = transiting.length === 0;
                const isCollapsed = !isHidden && collapsedHouses.has(house);
                const transitDayCount = allDays.filter(d => d.planets.some(p => p.house === house)).length;

                const rowClass =
                  'border-b border-white/5 transition-colors duration-150 cursor-pointer hover:bg-white/[0.05]';
                const openModal = () => setSelectedHouse(house);
                const stop = (e: React.MouseEvent) => { e.stopPropagation(); };

                const houseCol = (rowSpan: number, mode: 'hidden' | 'expanded') => (
                  <td rowSpan={rowSpan} className="px-4 py-3 align-middle border-r border-white/8">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center justify-center gap-0.5">
                        {mode === 'expanded' && (
                          <button
                            type="button"
                            onClick={e => { stop(e); toggleCollapsed(house); }}
                            className="shrink-0 w-5 h-5 flex items-center justify-center text-[9px] text-amber-300/70 hover:text-amber-200"
                            title="Collapse to one row"
                            aria-label="Collapse house row"
                          >
                            ▼
                          </button>
                        )}
                        <span
                          className={
                            (isEmpty ? 'text-white/80' : 'text-amber-200') + ' text-xl font-bold tabular-nums leading-none'
                          }
                        >
                          {house}
                        </span>
                      </div>
                      {hi?.sign && <span className="text-[10px] text-indigo-300/70">{hi.sign}</span>}
                      {hi?.signLord && <span className="text-[10px] text-cyan-400/60">{hi.signLord}</span>}
                      {transitDayCount > 0 && (
                        <span className="text-[9px] text-white/25 tabular-nums">{transitDayCount}d in range</span>
                      )}
                      <button
                        type="button"
                        onClick={e => { stop(e); toggleHouse(house); }}
                        className="mt-0.5 text-[11px] text-white/25 hover:text-white/60 transition-colors"
                        title={isHidden ? 'Show house' : 'Hide house'}
                        aria-label={isHidden ? 'Show house' : 'Hide house'}
                      >
                        {isHidden ? '👁' : '🙈'}
                      </button>
                    </div>
                  </td>
                );

                if (isHidden) {
                  return (
                    <tr
                      key={`h-${house}-hidden`}
                      className="border-b border-white/5 opacity-40"
                      onClick={openModal}
                    >
                      {houseCol(1, 'hidden')}
                      <td colSpan={7} className="px-3 py-2 text-xs text-white/20 italic">hidden (click to open transits)</td>
                    </tr>
                  );
                }

                if (isCollapsed) {
                  const summary = isEmpty
                    ? 'No planets in this house on the selected day'
                    : transiting.map(t => t.planet).join(' · ');
                  return (
                    <tr
                      key={`h-${house}-c`}
                      className={rowClass}
                      onClick={openModal}
                    >
                      <td className="px-4 py-2.5 align-middle border-r border-white/8 w-[72px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={e => { stop(e); toggleCollapsed(house); }}
                              className="shrink-0 w-5 h-5 flex items-center justify-center text-[9px] text-amber-300/70 hover:text-amber-200"
                              title="Expand row"
                              aria-label="Expand house row"
                            >
                              ▶
                            </button>
                            <span className="text-lg font-bold tabular-nums text-amber-200">{house}</span>
                          </div>
                          {hi?.sign && <span className="text-[10px] text-indigo-300/70">{hi.sign}</span>}
                          {transitDayCount > 0 && (
                            <span className="text-[9px] text-white/25 tabular-nums">{transitDayCount}d in range</span>
                          )}
                          <button
                            type="button"
                            onClick={e => { stop(e); toggleHouse(house); }}
                            className="text-[11px] text-white/25 hover:text-white/60"
                            title="Hide house"
                            aria-label="Hide house"
                          >
                            🙈
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-r border-white/8 max-w-[200px] align-middle">
                        <p className="text-xs font-medium text-amber-300/70 line-clamp-1">{hi?.mainTheme ?? '—'}</p>
                      </td>
                      <td colSpan={6} className="px-3 py-2.5 text-xs text-white/45">
                        {summary}
                      </td>
                    </tr>
                  );
                }

                if (isEmpty) {
                  return (
                    <tr
                      key={`h-${house}`}
                      className={rowClass}
                      onClick={openModal}
                    >
                      {houseCol(1, 'expanded')}
                      <td className="px-3 py-3 border-r border-white/8">
                        <p className="text-xs font-medium text-amber-300/70 leading-snug">{hi?.mainTheme ?? '—'}</p>
                        <p className="mt-0.5 text-[10px] text-white/30 leading-snug line-clamp-2">{hi?.represents}</p>
                      </td>
                      <td colSpan={6} className="px-3 py-3 text-xs text-white/30">—</td>
                    </tr>
                  );
                }

                return transiting.map((tp, pi) => {
                  const natal       = natalMap.get(tp.planet);
                  const signChanged = natal && tp.sign !== natal.sign;
                  const dignityKey  = tp.dignity.includes('exalted')     ? 'exalted'
                    : tp.dignity.includes('debilitated') ? 'debilitated'
                    : tp.dignity.includes('own')         ? 'own'          : 'neutral';
                  const rel = hi?.planetRelationships?.[tp.planet] ?? 'neutral';

                  return (
                    <tr
                      key={`${house}-${tp.planet}`}
                      className={rowClass}
                      onClick={openModal}
                    >

                      {pi === 0 && houseCol(transiting.length, 'expanded')}

                      {pi === 0 && (
                        <td rowSpan={transiting.length} className="px-3 py-3 align-middle border-r border-white/8 max-w-[180px]">
                          <p className="text-xs font-medium text-amber-300/70 leading-snug">{hi?.mainTheme ?? '—'}</p>
                          <p className="mt-0.5 text-[10px] text-white/30 leading-snug line-clamp-2">{hi?.represents}</p>
                        </td>
                      )}

                      <td className="px-4 py-3 font-medium text-white/90">
                        <span className="mr-2 text-lg">{PLANET_SYMBOL[tp.planet] ?? ''}</span>
                        {tp.planet}
                        {tp.isRetrograde && (
                          <span className="ml-1.5 rounded bg-red-400/20 px-1 py-0.5 text-[10px] text-red-300">℞</span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span>
                            <span className={signChanged ? 'text-amber-300 font-medium' : 'text-indigo-300'}>{tp.sign}</span>
                            <span className="ml-2 text-xs tabular-nums text-white/40">{tp.degreeInSign.toFixed(1)}°</span>
                          </span>
                          {hi?.signLord && <span className="text-[10px] text-cyan-400/80">Lord: {hi.signLord}</span>}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${REL_BADGE[rel]}`}
                          title={REL_TO_LORD_HINT[rel]}
                        >
                          {rel}
                        </span>
                        {hi?.signLord && (
                          <p className="mt-1 text-[10px] leading-tight text-white/35">{tp.planet} → {hi.signLord}</p>
                        )}
                      </td>

                      <td className="px-3 py-3 text-indigo-300/60 tabular-nums">
                        {natal
                          ? <span>{natal.sign} <span className="text-xs text-white/30">{natal.degreeInSign.toFixed(1)}°</span></span>
                          : '—'}
                      </td>

                      <td className="px-3 py-3 tabular-nums text-white/40">
                        {natal ? `H${natal.house}` : '—'}
                      </td>

                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] capitalize ${DIGNITY_BADGE[dignityKey]}`}>
                          {dignityKey}
                        </span>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
interface Props {
  chartId: string;
  natalLagna?: { sign: string; signIndex: number; degreeInSign: number; longitude: number };
}

export default function TransitPanel({ chartId, natalLagna }: Props) {
  const [queryParams, setQueryParams] = useState<{ from: string; to: string }>({ from: today, to: in30Days });
  const [basis, setBasis]             = useState<'lagna' | 'moon'>('moon');
  const [dayIndex, setDayIndex]       = useState(0);
  const [view, setView]               = useState<'chart' | 'table' | 'houses'>('chart');

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
    openModal(`${queryParams.from} to ${queryParams.to} · ${basis === 'moon' ? 'Moon basis' : 'Lagna basis'}`);
    setAiLoading(true);
    try {
      const res = await api.get<AiAnalysisResult>(
        `/birth-records/${chartId}/ai-analysis?from=${queryParams.from}&to=${queryParams.to}&basis=${basis}`,
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
    openModal(`${item.transitFrom} to ${item.transitTo} · ${item.basis === 'moon' ? 'Moon basis' : 'Lagna basis'}`);
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
    queryKey: ['transits', chartId, queryParams.from, queryParams.to, basis],
    queryFn: () =>
      api
        .get<TransitResponse>(
          `/birth-records/${chartId}/transits?from=${queryParams.from}&to=${queryParams.to}&basis=${basis}`,
        )
        .then(r => r.data),
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

  const houseInfoByHouse = data
    ? new Map((data.houseInfo ?? []).map(h => [h.house, h]))
    : null;

  return (
    <div className="flex flex-col gap-5">

      <AiAnalysisModal
        isOpen={aiOpen}
        isLoading={aiLoading}
        isError={aiError}
        data={aiData}
        transitPeriod={aiModalPeriod}
        onClose={() => setAiOpen(false)}
      />

      {/* ── Astro summary strip ── */}
      <AstroSummaryStrip chartId={chartId} />

      {/* ── Transit basis toggle ── */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Transit Basis</span>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          {(['lagna', 'moon'] as const).map(b => (
            <button
              key={b}
              type="button"
              onClick={() => setBasis(b)}
              className={[
                'rounded-md px-4 py-1.5 text-xs font-semibold transition',
                basis === b
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'text-white/55 hover:text-white/90',
              ].join(' ')}
            >
              {b === 'lagna' ? 'Lagna' : 'Moon'}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-white/30">
          {basis === 'lagna' ? 'Houses counted from Ascendant' : 'Houses counted from Moon sign (Chandra Lagna)'}
        </span>
      </div>

      {/* ── Compact date range form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">From</label>
          <input
            type="date"
            {...register('from')}
            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white/90 transition focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/30 [color-scheme:dark]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">To</label>
          <input
            type="date"
            {...register('to')}
            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white/90 transition focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/30 [color-scheme:dark]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="self-end rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_0_12px_rgba(251,191,36,0.2)] transition hover:bg-amber-300 disabled:opacity-50">
          {isLoading ? '…' : 'Calculate'}
        </button>
        {(errors.from || errors.to) && (
          <p className="w-full text-xs text-red-400">{errors.from?.message ?? errors.to?.message}</p>
        )}
      </form>

      {/* ── Error ── */}
      {isError && (
        <p className="rounded-xl bg-red-500/20 p-4 text-sm text-red-200">
          Failed to load transit data. Please try again.
        </p>
      )}

      {/* ── Spinner ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent shadow-[0_0_20px_rgba(251,191,36,0.3)]" />
          <p className="text-sm text-white/40">Calculating transits…</p>
        </div>
      )}

      {/* ── Results ── */}
      {data && !isLoading && (
        <>
          {/* Sticky date-slider + view toggle bar */}
          <div className="sticky top-12 z-20 -mx-4 mb-2 rounded-none border-y border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={data.days.length - 1}
                value={dayIndex}
                onChange={e => setDayIndex(Number(e.target.value))}
                className="flex-1 accent-amber-400"
              />
              <span className="shrink-0 rounded-md bg-white/10 px-3 py-1 text-sm font-medium tabular-nums text-amber-300">
                {selectedDay?.date}
              </span>
              {/* View toggle */}
              <div className="flex shrink-0 gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                {(['chart', 'houses', 'table'] as const).map(v => (
                  <button key={v} type="button" onClick={() => setView(v)}
                    className={[
                      'rounded-md px-3 py-1 text-xs font-medium transition',
                      view === v ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-white/60 hover:text-white/90',
                    ].join(' ')}>
                    {v === 'chart' ? 'Chart' : v === 'houses' ? 'Houses' : 'Table'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-white/30">
              <span>{data.from}</span>
              <span>{data.to}</span>
            </div>
          </div>

          {/* Chart view */}
          {view === 'chart' && transitChartShape && selectedDay && (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              {/* Transit diamond chart */}
              <div className="flex flex-col gap-3 lg:w-[420px] lg:shrink-0">
                <div className="w-full rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-4 shadow-xl backdrop-blur-md">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="border-l-2 border-cyan-400/50 pl-2 text-xs font-medium uppercase tracking-widest text-cyan-400/60">
                      Transit Chart
                    </span>
                    <span className="text-xs text-white/30">{selectedDay.date}</span>
                  </div>
                  <DiamondChart chart={transitChartShape} />
                </div>
                <p className="text-center text-xs text-white/30">
                  Houses from {basis === 'moon' ? 'Moon sign (Chandra Lagna)' : 'Ascendant (Lagna)'}{' '}
                  <span className="text-white/50">({data.natalLagna.sign})</span>
                </p>
              </div>

              {/* Transit positions */}
              <div className="flex-1 min-w-0 rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.03] px-5 py-5 backdrop-blur-md">
                <div className="mb-3">
                  <p className="border-l-2 border-amber-400/50 pl-3 text-xs font-medium uppercase tracking-widest text-white/40">
                    Transit Positions — {selectedDay.date}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
                    <span className="text-white/50">vs lord</span> is the natural (naisargika) relationship of the transiting planet to the sign lord.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {selectedDay.planets.map(p => {
                    const dignityKey = p.dignity.includes('exalted')     ? 'exalted'
                      : p.dignity.includes('debilitated') ? 'debilitated'
                      : p.dignity.includes('own')         ? 'own'          : 'neutral';
                    const hi = houseInfoByHouse?.get(p.house);
                    const rel = hi?.planetRelationships?.[p.planet] ?? 'neutral';
                    const lordSym = hi?.signLord ? (PLANET_SYMBOL[hi.signLord] ?? '') : '';
                    return (
                      <div
                        key={p.planet}
                        className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 transition-colors duration-150 hover:bg-white/[0.05] sm:px-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="text-xl text-white/70">{PLANET_SYMBOL[p.planet] ?? ''}</span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <span className="text-sm font-semibold text-white/90">{p.planet}</span>
                                {p.isRetrograde && (
                                  <span className="rounded bg-red-400/20 px-1 py-0.5 text-[10px] text-red-300">℞</span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] text-white/40">
                                House {p.house} <span className="text-white/25">·</span> from Moon
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:justify-end">
                            <div className="min-w-0">
                              <p className="font-medium text-indigo-200">
                                {p.sign}{' '}
                                <span className="tabular-nums text-xs font-normal text-white/45">
                                  {p.degreeInSign.toFixed(1)}°
                                </span>
                              </p>
                              {hi?.signLord && (
                                <p className="mt-0.5 text-[11px] text-cyan-300/85">
                                  Lord {lordSym} {hi.signLord}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 sm:items-center sm:text-center" title={REL_TO_LORD_HINT[rel]}>
                              <span className="text-[9px] uppercase tracking-wider text-white/30">vs lord</span>
                              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${REL_BADGE[rel]}`}>
                                {rel}
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-[9px] uppercase tracking-wider text-white/30">dignity</span>
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] capitalize ${DIGNITY_BADGE[dignityKey]}`}>
                                {dignityKey}
                              </span>
                            </div>
                          </div>
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

          {/* Houses view */}
          {view === 'houses' && selectedDay && (
            <HouseView
              planets={selectedDay.planets}
              houseInfo={data.houseInfo ?? []}
              natalPlanets={data.natalPlanets}
              date={selectedDay.date}
              allDays={data.days}
            />
          )}

          {/* Sign changes — collapsible */}
          <SignChangeSummary days={data.days} />

          {/* Mahadasha — collapsible */}
          <details className="rounded-2xl border border-white/10 bg-white/5">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
              <span className="border-l-2 border-amber-400/50 pl-3 text-xs font-medium uppercase tracking-widest text-white/40">
                Vimshottari Mahadasha
              </span>
              <span className="text-white/30 text-sm">▾</span>
            </summary>
            <div className="border-t border-white/8 px-5 pb-5 pt-4">
              <MahadashaPanel chartId={chartId} />
            </div>
          </details>

          {/* AI Analyses — collapsible */}
          <details className="rounded-2xl border border-violet-400/15 bg-violet-500/5">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
              <span className="flex items-center gap-2">
                <span className="border-l-2 border-violet-400/50 pl-3 text-xs font-medium uppercase tracking-widest text-violet-300/60">
                  AI Analyses
                </span>
                {analysesList && analysesList.length > 0 && (
                  <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] tabular-nums text-violet-300/70">
                    {analysesList.length}
                  </span>
                )}
              </span>
              <span className="text-white/30 text-sm">▾</span>
            </summary>
            <div className="border-t border-violet-400/10 px-5 pb-5 pt-4">
              <button
                type="button"
                onClick={handleAiAnalysis}
                className="flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/15 px-5 py-2 text-sm font-semibold text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.1)] transition hover:bg-violet-500/25 hover:border-violet-400/60 active:scale-95"
              >
                <span className="text-base">✦</span>
                Analyze with AI
              </button>

              {analysesList && analysesList.length > 0 && (
                <div className="mt-4 flex flex-col gap-1.5">
                  <p className="mb-1 text-[11px] uppercase tracking-widest text-white/25">Past Analyses</p>
                  {analysesList.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5 transition-colors duration-150 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center gap-3 text-xs flex-wrap">
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
                        <span className={[
                          'rounded-full px-2 py-0.5 text-[10px] font-medium',
                          item.basis === 'moon'
                            ? 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                            : 'border border-amber-400/30 bg-amber-400/10 text-amber-300',
                        ].join(' ')}>
                          {item.basis === 'moon' ? 'Moon basis' : 'Lagna basis'}
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
          </details>
        </>
      )}
    </div>
  );
}
