'use client';

import { useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface GemstoneAdvice {
  name: string;
  planet: string;
  reason: string;
}

export interface ThemeAnalysis {
  lifeAnalysis: string;
  transitAnalysis: string;
}

export interface AiAnalysisResult {
  lifeGeneral: ThemeAnalysis | string;
  personality: ThemeAnalysis | string;
  wealth: ThemeAnalysis | string;
  familyLife: ThemeAnalysis | string;
  marriageLife: ThemeAnalysis | string;
  strongAreas: string[];
  weakAreas: string[];
  recommendedGemstones: GemstoneAdvice[];
  gemstonesToAvoid: GemstoneAdvice[];
  transitPeriod: string;
  transitOverview: string;
  dashaAnalysis?: string;
}

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 border-l-2 border-amber-500/60 pl-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:border-amber-400/50 dark:text-white/40">
      {children}
    </h3>
  );
}

// ─── Prose block ─────────────────────────────────────────────────────────────
function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split(/\n+/).filter(Boolean).map((para, i) => (
        <p key={i} className="text-sm leading-relaxed text-slate-700 dark:text-white/80">
          {para}
        </p>
      ))}
    </div>
  );
}

const TRANSIT_SECTIONS = [
  { key: 'Career & Work',              label: 'Career & Work' },
  { key: 'Wealth, Finance & Losses',           label: 'Wealth & Finance' },
  { key: 'Relationships & Marriage',   label: 'Relationships & Marriage' },
  { key: 'Health & Energy',            label: 'Health & Energy' },
  { key: 'Family & Home',              label: 'Family & Home' },
  { key: 'Mental State & Emotions',    label: 'Mental State & Emotions' },
  { key: 'Spiritual & Hidden Matters', label: 'Spiritual & Hidden Matters' },
  { key: 'Overall Tone',               label: 'Overall Tone' },
];

function TransitOverview({ text }: { text: string }) {
  // Find each known heading position, then slice the body between them
  type Hit = { label: string; bodyStart: number };
  const hits: Hit[] = [];
  for (const s of TRANSIT_SECTIONS) {
    // match "(N) Label —" or "Label —" with em-dash or en-dash
    const re = new RegExp(`(?:\\(\\d+\\)\\s+)?${s.key.replace(/[&]/g, '\\&')}\\s*[—–-]+\\s*`, 'i');
    const m = re.exec(text);
    if (m) hits.push({ label: s.label, bodyStart: m.index + m[0].length });
  }
  // sort by position in the string
  hits.sort((a, b) => a.bodyStart - b.bodyStart);
  if (hits.length < 2) return <Prose text={text} />;
  const parts = hits.map((h, i) => ({
    label: h.label,
    body: text.slice(h.bodyStart, hits[i + 1]?.bodyStart ?? text.length).replace(/\s*\(\d+\)\s+\S.*$/, '').trim(),
  }));
  return (
    <div className="flex flex-col gap-4">
      {parts.map((p, i) => (
        <div key={i}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-400/60">
            {p.label}
          </p>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-white/80">{p.body}</p>
        </div>
      ))}
    </div>
  );
}

function ThemeBlock({ theme }: { theme: ThemeAnalysis | string }) {
  if (typeof theme === 'string') return <Prose text={theme} />;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30">Life Analysis</p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-white/80">{theme.lifeAnalysis}</p>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-400/50">Transit Analysis</p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-white/80">{theme.transitAnalysis}</p>
      </div>
    </div>
  );
}

// ─── Section nav tabs ────────────────────────────────────────────────────────
type ModalSection = 'overview' | 'personal' | 'gemstones' | 'transits';

const SECTIONS: { id: ModalSection; label: string }[] = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'personal',  label: 'Personal'  },
  { id: 'gemstones', label: 'Gemstones' },
  { id: 'transits',  label: 'Transits'  },
];

// ─── Main modal ──────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  isLoading: boolean;
  isError: boolean;
  data: AiAnalysisResult | null;
  transitPeriod: string;
  onClose: () => void;
}

export default function AiAnalysisModal({ isOpen, isLoading, isError, data, transitPeriod, onClose }: Props) {
  const [activeSection, setActiveSection] = useState<ModalSection>('overview');

  if (!isOpen) return null;

  const scrollToSection = (id: ModalSection) => {
    setActiveSection(id);
    const el = document.getElementById(`ai-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-100/90 p-4 backdrop-blur-sm dark:bg-slate-950/92 sm:p-6">
      <div className="relative my-6 w-full max-w-4xl rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 shadow-2xl dark:border-white/[0.12] dark:from-slate-900 dark:to-slate-950">

        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-3xl border-b border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Astrology Analysis</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-white/40">Transit period: {transitPeriod}</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-white/15 dark:text-white/50 dark:hover:border-white/30 dark:hover:bg-white/8 dark:hover:text-white/90"
            >
              ✕
            </button>
          </div>

          {/* Section nav pills — only show when data is loaded */}
          {data && !isLoading && (
            <div className="flex gap-1 overflow-x-auto scrollbar-hide border-t border-slate-100 px-6 py-2.5 dark:border-white/8">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className={[
                    'shrink-0 rounded-full px-4 py-1 text-xs font-medium transition',
                    activeSection === s.id
                      ? 'border border-amber-400/60 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-white/45 dark:hover:bg-white/8 dark:hover:text-white/80',
                  ].join(' ')}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-32 px-6">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-400 border-t-transparent shadow-[0_0_24px_rgba(251,191,36,0.3)]" />
            <p className="text-sm text-slate-600 dark:text-white/50">Consulting the stars… this may take 15–30 seconds</p>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="p-6">
            <p className="rounded-xl bg-red-100 p-4 text-sm text-red-900 dark:bg-red-500/20 dark:text-red-200">
              Failed to get AI analysis. Please check that the OpenAI API key is configured and try again.
            </p>
          </div>
        )}

        {/* Results */}
        {data && !isLoading && (
          <div className="flex flex-col gap-6 p-6">

            {/* ── Overview ── */}
            <div id="ai-overview" className="scroll-mt-32 rounded-2xl border border-indigo-400/20 bg-gradient-to-b from-indigo-400/8 to-indigo-400/3 p-5">
              <SectionTitle>Life Overview</SectionTitle>
              <ThemeBlock theme={data.lifeGeneral} />
            </div>

            {/* ── Personal ── */}
            <div id="ai-personal" className="scroll-mt-32 flex flex-col gap-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white p-5 dark:border-white/[0.12] dark:from-white/[0.07] dark:to-white/[0.03]">
                  <SectionTitle>Personality &amp; Character</SectionTitle>
                  <ThemeBlock theme={data.personality} />
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-b from-amber-400/8 to-amber-400/3 p-5">
                  <SectionTitle>Wealth &amp; Finance</SectionTitle>
                  <ThemeBlock theme={data.wealth} />
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white p-5 dark:border-white/[0.12] dark:from-white/[0.07] dark:to-white/[0.03]">
                  <SectionTitle>Family Life</SectionTitle>
                  <ThemeBlock theme={data.familyLife} />
                </div>
                <div className="rounded-2xl border border-pink-400/20 bg-gradient-to-b from-pink-400/8 to-pink-400/3 p-5">
                  <SectionTitle>Marriage &amp; Relationships</SectionTitle>
                  <ThemeBlock theme={data.marriageLife} />
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/8 to-emerald-400/3 p-5">
                  <SectionTitle>Strong Areas</SectionTitle>
                  <ul className="space-y-2">
                    {data.strongAreas?.map((area, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-white/80">
                        <span className="mt-0.5 shrink-0 text-emerald-400">✦</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-red-400/20 bg-gradient-to-b from-red-400/8 to-red-400/3 p-5">
                  <SectionTitle>Areas Needing Attention</SectionTitle>
                  <ul className="space-y-2">
                    {data.weakAreas?.map((area, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-white/80">
                        <span className="mt-0.5 shrink-0 text-red-400">◈</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ── Gemstones ── */}
            <div id="ai-gemstones" className="scroll-mt-32 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-400/8 to-amber-400/3 p-5">
                <SectionTitle>Recommended Gemstones</SectionTitle>
                <div className="flex flex-col gap-3">
                  {data.recommendedGemstones?.map((g, i) => (
                    <div key={i} className="rounded-xl border border-amber-400/20 bg-amber-400/8 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">{g.name}</span>
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-white/10 dark:text-white/50">
                          {g.planet}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-white/60">{g.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-red-400/20 bg-gradient-to-b from-red-400/8 to-red-400/3 p-5">
                <SectionTitle>Gemstones to Avoid</SectionTitle>
                <div className="flex flex-col gap-3">
                  {data.gemstonesToAvoid?.map((g, i) => (
                    <div key={i} className="rounded-xl border border-red-400/20 bg-red-400/8 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-red-800 dark:text-red-300">{g.name}</span>
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-white/10 dark:text-white/50">
                          {g.planet}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-white/60">{g.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Transits ── */}
            <div id="ai-transits" className="scroll-mt-32 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold text-cyan-300">
                  Transit Period: {data.transitPeriod}
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>
              <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-cyan-400/8 to-cyan-400/3 p-5">
                <SectionTitle>Transit Overview</SectionTitle>
                <TransitOverview text={data.transitOverview} />
              </div>
              {data.dashaAnalysis && (
                <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-b from-violet-400/8 to-violet-400/3 p-5">
                  <SectionTitle>Vimshottari Dasha Analysis</SectionTitle>
                  <Prose text={data.dashaAnalysis} />
                </div>
              )}
            </div>

            {/* Close button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-300/90 px-8 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white/90"
              >
                Close
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
