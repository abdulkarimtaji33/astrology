'use client';

import type { ReactNode } from 'react';

/**
 * Shared, mobile-first building blocks for showing planets/houses as cards instead of wide
 * tables. Everything wraps; nothing needs horizontal scrolling at 320px.
 */

export const PLANET_SYMBOL: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const ELEMENT: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

export type Tone = 'gold' | 'green' | 'red' | 'blue' | 'sky' | 'violet' | 'muted';

const TONE: Record<Tone, string> = {
  gold: 'bg-amber-100 text-amber-900 ring-amber-300/60 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/25',
  green: 'bg-emerald-100 text-emerald-900 ring-emerald-300/60 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-400/25',
  red: 'bg-red-100 text-red-900 ring-red-300/60 dark:bg-red-400/15 dark:text-red-200 dark:ring-red-400/25',
  blue: 'bg-blue-100 text-blue-900 ring-blue-300/60 dark:bg-blue-400/15 dark:text-blue-200 dark:ring-blue-400/25',
  sky: 'bg-sky-100 text-sky-900 ring-sky-300/60 dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-400/25',
  violet: 'bg-violet-100 text-violet-900 ring-violet-300/60 dark:bg-violet-400/15 dark:text-violet-200 dark:ring-violet-400/25',
  muted: 'bg-slate-100 text-slate-600 ring-slate-300/60 dark:bg-white/[0.06] dark:text-white/55 dark:ring-white/10',
};

export function Tag({ tone = 'muted', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

const ELEMENT_TONE: Record<string, Tone> = { Fire: 'red', Earth: 'green', Air: 'sky', Water: 'blue' };

export function ElementTag({ sign }: { sign: string }) {
  const el = ELEMENT[sign];
  return el ? <Tag tone={ELEMENT_TONE[el]}>{el}</Tag> : null;
}

export type Dignity = 'exalted' | 'debilitated' | 'own';

export function dignityOf(d: string[] | string | undefined): Dignity | null {
  const list = Array.isArray(d) ? d : d ? [d] : [];
  if (list.includes('exalted')) return 'exalted';
  if (list.includes('debilitated')) return 'debilitated';
  if (list.includes('own')) return 'own';
  return null;
}

const DIGNITY_TONE: Record<Dignity, Tone> = { exalted: 'green', debilitated: 'red', own: 'gold' };
const DIGNITY_LABEL: Record<Dignity, string> = { exalted: 'Exalted', debilitated: 'Debilitated', own: 'Own sign' };

export function DignityTag({ dignity }: { dignity: string[] | string | undefined }) {
  const d = dignityOf(dignity);
  return d ? <Tag tone={DIGNITY_TONE[d]}>{DIGNITY_LABEL[d]}</Tag> : null;
}

export type Rel = 'own' | 'friendly' | 'enemy' | 'neutral';
const REL_TONE: Record<Rel, Tone> = { own: 'gold', friendly: 'green', enemy: 'red', neutral: 'muted' };
const REL_LABEL: Record<Rel, string> = {
  own: 'Lord of sign',
  friendly: 'Friend of lord',
  enemy: 'Enemy of lord',
  neutral: 'Neutral to lord',
};

export function RelTag({ rel, lord }: { rel: Rel; lord?: string }) {
  return (
    <Tag tone={REL_TONE[rel]} title={lord ? `Natural relationship with ${lord}, lord of this sign` : undefined}>
      {REL_LABEL[rel]}
    </Tag>
  );
}

export function PlanetGlyph({ planet, size = 'md' }: { planet: string; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-8 w-8 text-base' : 'h-10 w-10 text-xl';
  return (
    <span
      aria-hidden
      className={`flex ${cls} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-amber-500/15 text-slate-800 ring-1 ring-inset ring-slate-300/60 dark:text-white/90 dark:ring-white/10`}
    >
      {PLANET_SYMBOL[planet] ?? '•'}
    </span>
  );
}

export function Retro() {
  return (
    <span title="Retrograde" className="rounded-md bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-300">
      ℞ Retro
    </span>
  );
}

export function HouseBadge({ house, active = true }: { house: number; active?: boolean }) {
  return (
    <span
      className={[
        'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl font-display leading-none',
        active
          ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-slate-900 shadow-md shadow-amber-500/20'
          : 'bg-slate-200/70 text-slate-500 dark:bg-white/[0.06] dark:text-white/40',
      ].join(' ')}
    >
      <span className="text-[9px] font-sans font-semibold uppercase tracking-wider opacity-70">H</span>
      <span className="text-lg font-bold">{house}</span>
    </span>
  );
}

/** Card shell used for every list item. */
export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const base = 'app-card w-full rounded-2xl p-4 text-left';
  const style = { border: '1px solid var(--app-border)' };
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} transition hover:-translate-y-0.5 hover:border-amber-400/50 ${className}`} style={style}>
        {children}
      </button>
    );
  }
  return (
    <div className={`${base} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-white/45">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/** Equal-width segmented control. Never overflows: options share the full width. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid w-full gap-1 rounded-2xl p-1 ring-1 ring-inset ring-slate-300/60 dark:ring-white/10"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, background: 'rgba(127,127,127,.08)' }}
    >
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={[
            'min-h-10 truncate rounded-xl px-2 text-sm font-semibold transition',
            value === o.value
              ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 shadow'
              : 'text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MeaningButton({ onClick, label = 'Meaning' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex min-h-9 items-center gap-1 rounded-xl px-3 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-400/40 transition hover:bg-amber-400/10 dark:text-amber-300"
    >
      {label} <span aria-hidden>›</span>
    </button>
  );
}
