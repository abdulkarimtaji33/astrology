'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';

export interface HousePlanetDetail {
  planet: string;
  degreeInSign: number;
  isRetrograde: boolean;
  dignity: string[];
  relationship: 'own' | 'friendly' | 'enemy' | 'neutral';
}

export interface HouseDetail {
  house: number;
  sign: string;
  signLord: string;
  mainTheme: string;
  represents: string;
  planets: HousePlanetDetail[];
}

// ─── color maps ───────────────────────────────────────────────────────────
const REL_STYLE: Record<string, string> = {
  own: 'bg-amber-200/80 text-amber-900 border-amber-300 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/30',
  friendly:
    'bg-emerald-200/80 text-emerald-900 border-emerald-300 dark:bg-emerald-400/20 dark:text-emerald-300 dark:border-emerald-400/30',
  enemy: 'bg-red-200/80 text-red-900 border-red-300 dark:bg-red-400/20 dark:text-red-300 dark:border-red-400/30',
  neutral: 'bg-slate-200/80 text-slate-600 border-slate-200 dark:bg-white/8 dark:text-white/45 dark:border-white/10',
};


const PLANET_SYM: Record<string, string> = {
  Sun: '\u2609',
  Moon: '\u263D',
  Mercury: '\u263F',
  Venus: '\u2640',
  Mars: '\u2642',
  Jupiter: '\u2643',
  Saturn: '\u2644',
  Rahu: '\u260A',
  Ketu: '\u260B',
};

const REL_LABEL: Record<string, string> = {
  own: 'Own', friendly: 'Friend', enemy: 'Enemy', neutral: 'Neutral',
};

interface HouseAiResult {
  interpretation: string;
  keyThemes: string[];
}

const DIGNITY_STYLE: Record<string, string> = {
  exalted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300',
  debilitated: 'bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-300',
  own: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
};

// ─── component ────────────────────────────────────────────────────────────
export default function HouseTable({
  houses,
  chartId,
  chartKind,
}: {
  houses: HouseDetail[];
  chartId: string;
  chartKind: 'lagna' | 'moon';
}) {
  const sorted = [...houses].sort((a, b) => a.house - b.house);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<HouseAiResult | null>(null);

  const toggleCollapse = useCallback((h: number) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(h)) next.delete(h); else next.add(h);
      return next;
    });
  }, []);

  const analyzeHouse = async (houseNum: number) => {
    setModalTitle(`House ${houseNum} · ${chartKind === 'moon' ? 'Chandra Lagna' : 'Lagna'}`);
    setResult(null);
    setError(false);
    setModalOpen(true);
    setLoading(true);
    try {
      const res = await api.get<HouseAiResult>(
        `/birth-records/${chartId}/house-ai?house=${houseNum}&chart=${chartKind}`,
        { timeout: 10 * 60 * 1000 },
      );
      setResult(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-xl">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-white/40">
          House Analysis
        </h2>
        {collapsed.size > 0 && (
          <button
            type="button"
            onClick={() => setCollapsed(new Set())}
            className="text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400/70 dark:hover:text-amber-300 transition-colors"
          >
            Expand all
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/90 text-left text-[11px] uppercase tracking-wider text-slate-500 dark:border-white/10 dark:text-white/30">
              <th className="px-4 py-2 w-[60px]">#</th>
              <th className="px-3 py-2 min-w-[120px]">Sign · Lord</th>
              <th className="px-3 py-2 min-w-[150px]">Theme</th>
              <th className="px-3 py-2">Planets</th>
              <th className="px-3 py-2 w-[28px]"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(h => {
              const isCollapsed = collapsed.has(h.house);
              const hasPlanets = h.planets.length > 0;
              const dignityPlanets = h.planets.filter(p => {
                const d = Array.isArray(p.dignity) ? p.dignity : [p.dignity];
                return d.includes('exalted') || d.includes('debilitated') || d.includes('own');
              });

              if (isCollapsed) {
                return (
                  <tr
                    key={h.house}
                    className="border-b border-slate-200/70 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] cursor-pointer"
                    onClick={() => toggleCollapse(h.house)}
                  >
                    <td className="px-3 py-1 border-r border-slate-200/60 dark:border-white/8">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-amber-500/60">▶</span>
                        <span className="text-sm font-bold tabular-nums text-amber-700/80 dark:text-amber-200/80">{h.house}</span>
                        <span className="text-[10px] text-indigo-600/60 dark:text-indigo-300/60">{h.sign}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1 text-[11px] text-slate-500 dark:text-white/35">
                      {h.signLord}
                    </td>
                    <td className="px-3 py-1 text-[11px] text-amber-700/70 dark:text-amber-300/60 line-clamp-1">
                      {h.mainTheme}
                    </td>
                    <td colSpan={2} className="px-3 py-1 text-[11px] text-slate-500 dark:text-white/40">
                      {hasPlanets
                        ? h.planets.map(p => `${PLANET_SYM[p.planet] ?? ''}${p.planet}`).join('  ')
                        : <span className="text-slate-300 dark:text-white/20">empty</span>}
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={h.house}
                  className="border-b border-slate-200/70 align-top transition hover:bg-slate-50/90 dark:border-white/5 dark:hover:bg-white/[0.03]"
                >
                  {/* house number + collapse btn */}
                  <td className="px-3 py-3 border-r border-slate-200/60 dark:border-white/8">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleCollapse(h.house)}
                        title="Collapse row"
                        className="text-[9px] text-slate-400/60 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
                      >▼</button>
                      <span className={`text-lg font-bold tabular-nums leading-none ${hasPlanets ? 'text-amber-700 dark:text-amber-200' : 'text-slate-400 dark:text-white/30'}`}>
                        {h.house}
                      </span>
                      <span className="text-[10px] text-indigo-600/70 dark:text-indigo-300/60">{h.sign}</span>
                      <span className="text-[10px] text-cyan-600/60 dark:text-cyan-400/50">{h.signLord}</span>
                    </div>
                  </td>

                  {/* sign · lord already in house col; here just theme */}
                  <td className="px-3 py-3">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white/80">{h.sign}
                      <span className="ml-1.5 font-normal text-slate-500 dark:text-white/40 text-[11px]">· {h.signLord}</span>
                    </p>
                  </td>

                  {/* theme + represents */}
                  <td className="min-w-[150px] px-3 py-3">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300/80">{h.mainTheme}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-white/35 line-clamp-2">{h.represents}</p>
                  </td>

                  {/* planets + dignity inline */}
                  <td className="px-3 py-3">
                    {!hasPlanets ? (
                      <span className="text-xs text-slate-300 dark:text-white/20">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {h.planets.map(p => {
                          const dignityList = Array.isArray(p.dignity) ? p.dignity : [p.dignity];
                          const special = dignityList.find(d => d !== 'neutral');
                          return (
                            <div key={p.planet}
                              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${REL_STYLE[p.relationship]}`}>
                              <span>{PLANET_SYM[p.planet] ?? ''}</span>
                              <span>{p.planet}</span>
                              {p.isRetrograde && <span className="opacity-60 text-[10px]">℞</span>}
                              <span className="opacity-50 tabular-nums text-[10px]">{Math.floor(p.degreeInSign)}°</span>
                              {special && (
                                <span className={`rounded px-1 py-0.5 text-[9px] font-bold uppercase ${DIGNITY_STYLE[special] ?? ''}`}>
                                  {special === 'own' ? 'own' : special.slice(0, 3)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {dignityPlanets.length === 0 && null}
                      </div>
                    )}
                  </td>

                  {/* AI button */}
                  <td className="px-3 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => analyzeHouse(h.house)}
                      disabled={loading}
                      title={`AI analysis for House ${h.house}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-300/70 bg-violet-100/80 text-xs text-violet-800 transition hover:bg-violet-200/80 disabled:opacity-40 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
                      aria-busy={loading}
                    >
                      ✦
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="house-ai-title"
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-white/15 dark:bg-slate-900/95">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/90 px-5 py-4 dark:border-white/10">
              <h3 id="house-ai-title" className="text-sm font-semibold text-slate-900 dark:text-white">
                {modalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 text-sm text-slate-700 dark:text-white/80">
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-500 border-t-transparent dark:border-violet-400" />
                </div>
              )}
              {error && !loading && (
                <p className="text-red-700 dark:text-red-300">Could not load analysis. Try again.</p>
              )}
              {result && !loading && (
                <div className="space-y-4">
                  <p className="whitespace-pre-wrap leading-relaxed">{result.interpretation}</p>
                  {result.keyThemes?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-white/40">
                        Themes
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-slate-600 dark:text-white/70">
                        {result.keyThemes.map(t => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
