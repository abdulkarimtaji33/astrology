'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { DiamondChart, ChartShape } from './LagnaChartSVG';
import AiAnalysisModal, { AiAnalysisResult } from './AiAnalysisModal';
import MahadashaPanel from './MahadashaPanel';
import PlacementMeaningModal, { PlacementMeaningPayload } from './PlacementMeaningModal';
import {
  Card, DignityTag, ElementTag, HouseBadge, MeaningButton, PlanetGlyph, Rel, RelTag, Retro, Segmented, SectionHeader,
} from './placement-ui';
import { useDialog } from '@/lib/use-dialog';

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
const addDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const today    = addDays(0);
const in30Days = addDays(30);

const PRESETS = [
  { label: '30 days', days: 30 },
  { label: '3 months', days: 91 },
  { label: '6 months', days: 182 },
  { label: '1 year', days: 365 },
];

/** 2026-10-21 → "21 Oct 2026" (or "Wed, 21 Oct 2026" with weekday). */
function prettyDate(iso: string, weekday = false): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...(weekday ? { weekday: 'short' } : {}) });
}

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









// ─── Transit planet card (replaces the wide comparison table) ──────────────
function TransitPlanetCard({
  tp,
  natal,
  hi,
  onMeaning,
}: {
  tp: TransitPlanet;
  natal?: TransitPlanet;
  hi?: TransitHouseInfo;
  onMeaning: () => void;
}) {
  const rel = (hi?.planetRelationships?.[tp.planet] ?? 'neutral') as Rel;
  const moved = natal && natal.sign !== tp.sign;
  return (
    <Card className="flex h-full gap-3">
      <PlanetGlyph planet={tp.planet} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold">{tp.planet}</span>
          {tp.isRetrograde && <Retro />}
          <span className="chip ml-auto">House {tp.house}</span>
        </div>
        <p className="mt-0.5 text-sm">
          <span className="font-medium text-indigo-800 dark:text-indigo-200">{tp.sign}</span>{' '}
          <span className="tabular-nums text-slate-500 dark:text-white/45">{tp.degreeInSign.toFixed(1)}°</span>
          {hi?.signLord && (
            <span className="text-xs text-slate-500 dark:text-white/45">
              {' '}· lord {PLANET_SYMBOL[hi.signLord] ?? ''} {hi.signLord}
            </span>
          )}
        </p>
        {hi?.mainTheme && <p className="mt-0.5 text-xs font-medium text-amber-800 dark:text-amber-200/90">{hi.mainTheme}</p>}
        <div className="mt-2 flex flex-wrap gap-1">
          <RelTag rel={rel} lord={hi?.signLord} />
          <DignityTag dignity={tp.dignity} />
          <ElementTag sign={tp.sign} />
        </div>
        {natal && (
          <p className="mt-2 text-xs text-slate-500 dark:text-white/45">
            Birth chart:{' '}
            <span className={moved ? 'font-semibold text-amber-700 dark:text-amber-300' : ''}>
              {natal.sign} {natal.degreeInSign.toFixed(1)}°
            </span>{' '}
            · House {natal.house}
          </p>
        )}
        <div className="mt-2">
          <MeaningButton onClick={onMeaning} />
        </div>
      </div>
    </Card>
  );
}

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
  const [meaningPayload, setMeaningPayload] = useState<PlacementMeaningPayload | null>(null);

  return (
    <div>
      {meaningPayload && (
        <PlacementMeaningModal payload={meaningPayload} onClose={() => setMeaningPayload(null)} />
      )}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {transitPlanets.map(tp => (
          <li key={tp.planet}>
            <TransitPlanetCard
              tp={tp}
              natal={natalMap.get(tp.planet)}
              hi={houseByNum.get(tp.house)}
              onMeaning={() => setMeaningPayload({ planet: tp.planet, house: tp.house, sign: tp.sign })}
            />
          </li>
        ))}
      </ul>
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
    <details className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-xs font-medium uppercase tracking-widest text-slate-600 dark:text-white/40">
        <span>
          Sign Changes in Range
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] normal-case tabular-nums text-slate-600 dark:text-white/40">
            {changes.length}
          </span>
        </span>
        <span className="text-slate-500 dark:text-white/30">▾</span>
      </summary>
      <div className="flex flex-wrap gap-2 border-t border-slate-200/70 dark:border-white/8 px-5 pb-4 pt-3">
        {changes.map((c, i) => (
          <div key={i}
            className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs">
            <span className="mr-0.5">{PLANET_SYMBOL[c.planet] ?? ''}</span>
            <span className="font-medium text-amber-300">{c.planet}</span>
            <span className="text-slate-600 dark:text-white/40">{c.from} → {c.to}</span>
            <span className="text-slate-500 dark:text-white/30">{c.date}</span>
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
  defaultEmail,
  onClose,
}: {
  payload: ReminderPayload;
  defaultEmail: string;
  onClose: () => void;
}) {
  useDialog(onClose);
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [sendDate, setSendDate] = useState(payload.firstIsoDate);
  const [subject, setSubject] = useState(
    `Transit reminder: ${payload.planet} in House ${payload.houseNum}${payload.houseSign ? ` (${payload.houseSign})` : ''}`,
  );
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const queryClient = useQueryClient();

  useEffect(() => {
    setRecipientEmail(defaultEmail);
    setSendDate(payload.firstIsoDate);
    setSubject(
      `Transit reminder: ${payload.planet} in House ${payload.houseNum}${payload.houseSign ? ` (${payload.houseSign})` : ''}`,
    );
    setNote('');
    setStatus('idle');
  }, [
    defaultEmail,
    payload.planet,
    payload.houseNum,
    payload.houseSign,
    payload.firstIsoDate,
    payload.dateRange,
  ]);

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
    const email = recipientEmail.trim() || defaultEmail.trim();
    if (!email || !sendDate || !subject) return;
    setStatus('loading');
    try {
      await api.post('/reminders', {
        recipientEmail: email,
        sendDate,
        subject,
        placementDetails,
        note: note || undefined,
      });
      void queryClient.invalidateQueries({ queryKey: ['reminders'] });
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
        className="relative z-10 w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-indigo-400/20 bg-white dark:bg-[#0d0d1c] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-200/70 dark:border-white/8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-indigo-300">
                Schedule Reminder Email
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-white/40 mt-0.5">
                {PLANET_SYMBOL[payload.planet] ?? ''} {payload.planet} · House {payload.houseNum}
                {payload.houseSign ? ` · ${payload.houseSign}` : ''}
              </p>
              <p className="text-[11px] text-indigo-300/60 mt-1 tabular-nums">{payload.dateRange}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 dark:text-white/30 hover:text-slate-600 dark:text-white/60 text-lg leading-none p-1"
              aria-label="Close"
            >✕</button>
          </div>
        </div>

        {status === 'success' ? (
          <div className="overflow-y-auto flex-1 px-5 py-8 text-center flex flex-col items-center gap-3">
            <span className="text-3xl">✅</span>
            <p className="text-sm text-slate-800 dark:text-white/80 font-medium">Reminder scheduled!</p>
            <p className="text-[11px] text-slate-600 dark:text-white/40">
              An email will be sent to <span className="text-slate-600 dark:text-white/60">{recipientEmail.trim() || defaultEmail}</span> on{' '}
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
          <form onSubmit={submit} className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
            {/* Placement preview */}
            <div className="rounded-xl border border-slate-200/70 dark:border-white/8 bg-white/[0.03] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/25 mb-1">Placement details (auto-filled)</p>
              <pre className="text-[11px] text-slate-500 dark:text-white/50 whitespace-pre-wrap leading-relaxed font-sans">{placementDetails}</pre>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] text-slate-600 dark:text-white/40 mb-1.5">
                Recipient email <span className="text-slate-400 dark:text-white/25">(optional if same as account)</span>
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder={defaultEmail || 'you@example.com'}
                className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-900 dark:text-white/90 placeholder:text-slate-400 dark:text-white/25 focus:border-indigo-400/50 focus:outline-none"
              />
            </div>

            {/* Send date + shortcuts */}
            <div>
              <label className="block text-[11px] text-slate-600 dark:text-white/40 mb-1.5">Send on date</label>
              <input
                type="date"
                required
                value={sendDate}
                onChange={e => setSendDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-900 dark:text-white/90 focus:border-indigo-400/50 focus:outline-none"
              />
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setSendDate(payload.firstIsoDate)}
                  className="rounded-lg border border-slate-200/90 dark:border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-500 dark:text-white/50 hover:bg-white/[0.07] hover:text-slate-700 dark:text-white/70 transition-colors"
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
              <label className="block text-[11px] text-slate-600 dark:text-white/40 mb-1.5">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-900 dark:text-white/90 placeholder:text-slate-400 dark:text-white/25 focus:border-indigo-400/50 focus:outline-none"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-[11px] text-slate-600 dark:text-white/40 mb-1.5">
                Extra note <span className="text-slate-400 dark:text-white/20">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Add any personal notes or instructions..."
                className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-900 dark:text-white/90 placeholder:text-slate-400 dark:text-white/25 focus:border-indigo-400/50 focus:outline-none resize-none"
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
                className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-600 dark:text-white/40 hover:bg-white/[0.07] transition-colors"
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
  defaultEmail,
  onClose,
}: {
  house: number;
  hi: TransitHouseInfo | undefined;
  allDays: TransitDayData[];
  defaultEmail: string;
  onClose: () => void;
}) {
  useDialog(onClose);
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
        defaultEmail={defaultEmail}
        onClose={() => setReminderPayload(null)}
      />
    )}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-[#0f0f1a] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-slate-200/70 dark:border-white/8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-amber-300">
                House {house} · {hi?.sign ?? ''}
              </h3>
              {hi?.mainTheme && <p className="text-xs text-slate-600 dark:text-white/40 mt-0.5">{hi.mainTheme}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={copyToClipboard}
                className="rounded-lg border border-slate-300 dark:border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-white/70 hover:bg-white/10 transition-colors"
              >
                {copyDone ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 dark:text-white/30 hover:text-slate-600 dark:text-white/60 text-lg leading-none transition-colors p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-slate-500 dark:text-white/50">
              <input
                type="checkbox"
                checked={ignoreMoon}
                onChange={e => setIgnoreMoon(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/40"
              />
              Ignore Moon (hide Moon rows and days where only Moon is in this house)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-white/30">
              {totalTransits} day{totalTransits !== 1 ? 's' : ''} with a planet{ignoreMoon ? ' (excl. Moon)' : ''} in
              this house
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          {entries.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-white/30">No matching planets in this house for the selected range.</p>
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
                    <span className="text-xs font-medium text-slate-800 dark:text-white/80">{planet}</span>
                    <span className="text-[10px] text-slate-500 dark:text-white/30 ml-auto">{dates.length} day{dates.length !== 1 ? 's' : ''}</span>
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
                        className="group flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-slate-600 dark:text-white/60 tabular-nums hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all duration-150"
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
  accountEmail,
}: {
  planets: TransitPlanet[];
  houseInfo: TransitHouseInfo[];
  natalPlanets: TransitPlanet[];
  date: string;
  allDays: TransitDayData[];
  accountEmail?: string | null;
}) {
  const [filter, setFilter] = useState<'occupied' | 'all'>('occupied');
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [meaningPayload, setMeaningPayload] = useState<PlacementMeaningPayload | null>(null);

  const natalMap = new Map(natalPlanets.map(p => [p.planet, p]));
  const houseByNum = new Map(houseInfo.map(h => [h.house, h]));

  const allHouses = Array.from({ length: 12 }, (_, i) => i + 1).map(h => ({
    house: h,
    hi: houseByNum.get(h),
    transiting: planets.filter(p => p.house === h).sort((a, b) => a.planet.localeCompare(b.planet)),
    days: allDays.filter(d => d.planets.some(p => p.house === h)).length,
  }));
  const shown = filter === 'occupied' ? allHouses.filter(h => h.transiting.length > 0) : allHouses;

  return (
    <>
      {selectedHouse !== null && (
        <HouseHistoryModal
          house={selectedHouse}
          hi={houseByNum.get(selectedHouse)}
          allDays={allDays}
          defaultEmail={accountEmail ?? ''}
          onClose={() => setSelectedHouse(null)}
        />
      )}
      {meaningPayload && (
        <PlacementMeaningModal payload={meaningPayload} onClose={() => setMeaningPayload(null)} />
      )}

      <SectionHeader
        title="Houses"
        subtitle={<>Transits on {prettyDate(date)} · open <strong>History</strong> to see the whole range or set a reminder</>}
        right={
          <div className="w-full sm:w-60">
            <Segmented
              ariaLabel="Which houses to show"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'occupied', label: 'With planets' },
                { value: 'all', label: 'All 12' },
              ]}
            />
          </div>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map(({ house, hi, transiting, days }) => (
          <li key={house}>
            <Card className="flex h-full flex-col gap-3">
              <div className="flex items-start gap-3">
                <HouseBadge house={house} active={transiting.length > 0} />
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold text-amber-800 dark:text-amber-200">{hi?.mainTheme ?? `House ${house}`}</p>
                  {hi && (
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      {hi.sign} · lord {PLANET_SYMBOL[hi.signLord] ?? ''} {hi.signLord}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHouse(house)}
                  className="flex min-h-10 shrink-0 flex-col items-center justify-center rounded-xl px-3 text-xs font-semibold text-cyan-800 ring-1 ring-inset ring-cyan-500/40 transition hover:bg-cyan-500/10 dark:text-cyan-200"
                >
                  History
                  {days > 0 && <span className="text-[10px] font-normal opacity-70">{days} days</span>}
                </button>
              </div>
              {hi?.represents && (
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-white/55">{hi.represents}</p>
              )}
              {transiting.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {transiting.map(tp => {
                    const natal = natalMap.get(tp.planet);
                    const rel = (hi?.planetRelationships?.[tp.planet] ?? 'neutral') as Rel;
                    return (
                      <li key={tp.planet}>
                        <button
                          type="button"
                          onClick={() => setMeaningPayload({ planet: tp.planet, house, sign: tp.sign })}
                          className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-slate-500/[0.06] px-3 py-2 text-left transition hover:bg-amber-400/10"
                        >
                          <span aria-hidden className="text-xl leading-none">{PLANET_SYMBOL[tp.planet] ?? '•'}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold">{tp.planet}</span>
                              <span className="text-xs text-slate-500 dark:text-white/45">
                                {tp.sign} <span className="tabular-nums">{tp.degreeInSign.toFixed(1)}°</span>
                              </span>
                              {tp.isRetrograde && <Retro />}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-1">
                              <RelTag rel={rel} lord={hi?.signLord} />
                              <DignityTag dignity={tp.dignity} />
                            </span>
                            {natal && (
                              <span className="mt-1 block text-[11px] text-slate-500 dark:text-white/40">
                                Birth chart: {natal.sign} · House {natal.house}
                              </span>
                            )}
                          </span>
                          <span aria-hidden className="text-slate-400">›</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed px-3 py-2 text-xs text-slate-500 dark:text-white/40" style={{ borderColor: 'var(--app-border-strong)' }}>
                  No planets passing through on this day
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="text-sm text-slate-500">No planets on this day.</p>
      )}
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
interface Props {
  chartId: string;
  natalLagna?: { sign: string; signIndex: number; degreeInSign: number; longitude: number };
  accountEmail?: string | null;
}

export default function TransitPanel({ chartId, natalLagna, accountEmail }: Props) {
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
    setValue,
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

  const applyPreset = (days: number) => {
    const to = addDays(days);
    setValue('from', today);
    setValue('to', to);
    setQueryParams({ from: today, to });
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
    <div className="flex flex-col gap-5">

      <AiAnalysisModal
        isOpen={aiOpen}
        isLoading={aiLoading}
        isError={aiError}
        data={aiData}
        transitPeriod={aiModalPeriod}
        onClose={() => setAiOpen(false)}
      />

      {/* ── Controls ── */}
      <Card className="flex flex-col gap-4">
        <div>
          <p className="mb-1.5 text-sm font-medium">Count houses from</p>
          <Segmented
            ariaLabel="Transit basis"
            value={basis}
            onChange={setBasis}
            options={[
              { value: 'moon', label: 'Moon sign' },
              { value: 'lagna', label: 'Ascendant' },
            ]}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <p className="mb-1.5 text-sm font-medium">Period</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map(pr => {
                const active = queryParams.from === today && queryParams.to === addDays(pr.days);
                return (
                  <button
                    key={pr.label}
                    type="button"
                    onClick={() => applyPreset(pr.days)}
                    className={[
                      'min-h-10 rounded-xl px-2 text-sm font-semibold ring-1 ring-inset transition',
                      active
                        ? 'bg-amber-400/20 text-amber-900 ring-amber-400/60 dark:text-amber-200'
                        : 'text-slate-600 ring-slate-300/60 hover:ring-amber-400/50 dark:text-white/60 dark:ring-white/10',
                    ].join(' ')}
                  >
                    {pr.label}
                  </button>
                );
              })}
            </div>
          </div>
          <details className="group">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between rounded-xl px-1 text-sm font-medium text-slate-600 dark:text-white/60">
              <span>Custom dates · {prettyDate(queryParams.from)} → {prettyDate(queryParams.to)}</span>
              <span aria-hidden className="transition group-open:rotate-180">▾</span>
            </summary>
            <div className="mt-2 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500 dark:text-white/50">From</span>
                <input type="date" {...register('from')} className="app-input [color-scheme:light] dark:[color-scheme:dark]" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500 dark:text-white/50">To</span>
                <input type="date" {...register('to')} className="app-input [color-scheme:light] dark:[color-scheme:dark]" />
              </label>
              <button type="submit" disabled={isLoading} className="btn btn-primary min-[400px]:col-span-2">
                {isLoading ? 'Calculating…' : 'Show transits'}
              </button>
            </div>
            {(errors.from || errors.to) && (
              <p className="mt-2 text-xs text-red-500">{errors.from?.message ?? errors.to?.message}</p>
            )}
          </details>
        </form>
      </Card>

      {/* ── Error ── */}
      {isError && (
        <p role="alert" className="rounded-xl border border-red-300/60 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200">
          Failed to load transit data. Please try again.
        </p>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-36" />)}
        </div>
      )}

      {/* ── Results ── */}
      {data && !isLoading && (
        <>
          {/* Day scrubber: big prev/next buttons + full-width slider, never overflows */}
          <div
            className="sticky top-14 z-20 -mx-4 border-y px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border"
            style={{ background: 'var(--nav-bg)', borderColor: 'var(--app-border)' }}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous day"
                disabled={dayIndex <= 0}
                onClick={() => setDayIndex(i => Math.max(0, i - 1))}
                className="btn btn-secondary h-11 w-11 shrink-0 !p-0 text-lg"
              >
                ‹
              </button>
              <div className="min-w-0 flex-1 text-center">
                <p className="truncate font-display text-lg font-semibold">{selectedDay ? prettyDate(selectedDay.date, true) : ''}</p>
                <p className="text-[11px] text-slate-500 dark:text-white/45">
                  Day {dayIndex + 1} of {data.days.length}
                  {dayIndex !== 0 && (
                    <button type="button" onClick={() => setDayIndex(0)} className="ml-2 font-semibold text-amber-700 dark:text-amber-300">
                      Back to start
                    </button>
                  )}
                </p>
              </div>
              <button
                type="button"
                aria-label="Next day"
                disabled={dayIndex >= data.days.length - 1}
                onClick={() => setDayIndex(i => Math.min(data.days.length - 1, i + 1))}
                className="btn btn-secondary h-11 w-11 shrink-0 !p-0 text-lg"
              >
                ›
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={data.days.length - 1}
              value={dayIndex}
              onChange={e => setDayIndex(Number(e.target.value))}
              aria-label="Pick a day in the period"
              className="mt-2 h-8 w-full accent-amber-500"
            />
          </div>

          {/* View switch on its own row: equal-width, always fits */}
          <Segmented
            ariaLabel="Transit view"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'houses', label: 'Houses' },
              { value: 'table', label: 'Planets' },
            ]}
          />

          {/* Chart view */}
          {view === 'chart' && transitChartShape && selectedDay && (
            <div className="flex flex-col gap-4">
              <Card className="mx-auto w-full max-w-[460px] !p-3 sm:!p-4">
                <DiamondChart chart={transitChartShape} />
                <p className="mt-2 text-center text-xs text-slate-500 dark:text-white/45">
                  Houses from {basis === 'moon' ? 'Moon sign' : 'Ascendant'} ({data.natalLagna.sign})
                </p>
              </Card>
              <TransitTable
                transitPlanets={selectedDay.planets}
                natalPlanets={data.natalPlanets}
                houseInfo={data.houseInfo ?? []}
              />
            </div>
          )}

          {/* Planets view */}
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
              accountEmail={accountEmail}
            />
          )}

          {/* Sign changes — collapsible */}
          <SignChangeSummary days={data.days} />

          {/* Mahadasha — collapsible */}
          <details className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
              <span className="border-l-2 border-amber-400/50 pl-3 text-xs font-medium uppercase tracking-widest text-slate-600 dark:text-white/40">
                Vimshottari Mahadasha
              </span>
              <span className="text-slate-500 dark:text-white/30 text-sm">▾</span>
            </summary>
            <div className="border-t border-slate-200/70 dark:border-white/8 px-5 pb-5 pt-4">
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
              <span className="text-slate-500 dark:text-white/30 text-sm">▾</span>
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
                  <p className="mb-1 text-[11px] uppercase tracking-widest text-slate-400 dark:text-white/25">Past Analyses</p>
                  {analysesList.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-white/8 bg-white/[0.03] px-4 py-2.5 transition-colors duration-150 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <span className="tabular-nums text-slate-500 dark:text-white/50">
                          {new Date(item.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}{' '}
                          <span className="text-slate-500 dark:text-white/30">
                            {new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                        <span className="rounded-full border border-slate-200/90 dark:border-white/10 bg-white/5 px-2 py-0.5 text-slate-600 dark:text-white/40">
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
