'use client';

import { useState } from 'react';
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
  own:      'bg-amber-400/20 text-amber-300 border-amber-400/30',
  friendly: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
  enemy:    'bg-red-400/20 text-red-300 border-red-400/30',
  neutral:  'bg-white/8 text-white/45 border-white/10',
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<HouseAiResult | null>(null);

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
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-white/40">
          House Analysis
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-white/30">
              <th className="px-4 py-2.5 w-8">#</th>
              <th className="px-3 py-2.5">Sign · Lord</th>
              <th className="px-3 py-2.5">Theme</th>
              <th className="px-3 py-2.5">Planets</th>
              <th className="px-3 py-2.5">Dignity</th>
              <th className="px-3 py-2.5 w-0">AI</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(h => (
              <tr key={h.house}
                className="border-b border-white/5 align-top transition hover:bg-white/[0.03]">

                {/* house number */}
                <td className="px-4 py-3 tabular-nums text-white/30 font-medium text-xs">
                  {h.house}
                </td>

                {/* sign + lord */}
                <td className="px-3 py-3 min-w-[130px]">
                  <span className="text-indigo-300 font-medium">{h.sign}</span>
                  <span className="mx-1 text-white/20">·</span>
                  <span className="text-white/55 text-xs">{h.signLord}</span>
                </td>

                {/* theme + represents */}
                <td className="px-3 py-3 min-w-[160px]">
                  <p className="text-amber-300/80 font-medium text-xs">{h.mainTheme}</p>
                  <p className="text-white/35 text-[11px] leading-snug mt-0.5">{h.represents}</p>
                </td>

                {/* planets */}
                <td className="px-3 py-3">
                  {h.planets.length === 0 ? (
                    <span className="text-white/20 text-xs">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {h.planets.map(p => (
                        <div key={p.planet}
                          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${REL_STYLE[p.relationship]}`}>
                          {/* symbol + name */}
                          <span>{PLANET_SYM[p.planet] ?? ''}</span>
                          <span>{p.planet}</span>
                          {p.isRetrograde && <span className="opacity-70">{'\u1D3F'}</span>}
                          {/* degree */}
                          <span className="opacity-55 tabular-nums">
                            {Math.floor(p.degreeInSign)}°
                          </span>
                          {/* relationship to lord */}
                          <span className="text-[10px] opacity-55">
                            {REL_LABEL[p.relationship]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>

                {/* dignity */}
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-2">
                    {h.planets.filter(p => {const d = Array.isArray(p.dignity) ? p.dignity : [p.dignity]; return !d.includes('neutral') || d.length > 1;}).map(p => (
                      <div key={p.planet} className="flex flex-col gap-0.5">
                        <span className="text-white/50 text-[11px]">{p.planet}</span>
                        {(Array.isArray(p.dignity) ? p.dignity : [p.dignity]).includes('exalted') && (
                          <span className="inline-block w-fit rounded bg-emerald-400/25 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            Exalted
                          </span>
                        )}
                        {(Array.isArray(p.dignity) ? p.dignity : [p.dignity]).includes('debilitated') && (
                          <span className="inline-block w-fit rounded bg-red-400/25 px-2 py-0.5 text-[10px] font-bold text-red-300">
                            Debilitated
                          </span>
                        )}
                        {(Array.isArray(p.dignity) ? p.dignity : [p.dignity]).includes('own') && (
                          <span className="inline-block w-fit rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            Own Sign
                          </span>
                        )}
                      </div>
                    ))}
                    {(h.planets.length === 0 || h.planets.every(p => p.dignity.includes('neutral'))) && (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 align-middle">
                  <button
                    type="button"
                    onClick={() => analyzeHouse(h.house)}
                    disabled={loading}
                    className="whitespace-nowrap rounded-lg border border-violet-400/35 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200/90 transition hover:bg-violet-500/20 disabled:opacity-40"
                    aria-busy={loading}
                  >
                    Analyze with AI
                  </button>
                </td>
              </tr>
            ))}
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
          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-slate-900/95 shadow-2xl flex flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <h3 id="house-ai-title" className="text-sm font-semibold text-white">
                {modalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-2 py-1 text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 text-sm text-white/80">
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
                </div>
              )}
              {error && !loading && (
                <p className="text-red-300">Could not load analysis. Try again.</p>
              )}
              {result && !loading && (
                <div className="space-y-4">
                  <p className="whitespace-pre-wrap leading-relaxed">{result.interpretation}</p>
                  {result.keyThemes?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Themes</p>
                      <ul className="list-disc space-y-1 pl-5 text-white/70">
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
