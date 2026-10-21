'use client';

import { useState } from 'react';
import api from '@/lib/api';
import PlacementMeaningModal, { PlacementMeaningPayload } from './PlacementMeaningModal';
import { Card, DignityTag, HouseBadge, PLANET_SYMBOL, RelTag, Retro, Segmented, SectionHeader } from './placement-ui';
import { useDialog } from '@/lib/use-dialog';

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
  const [filter, setFilter] = useState<'all' | 'occupied'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<HouseAiResult | null>(null);
  const [meaningPayload, setMeaningPayload] = useState<PlacementMeaningPayload | null>(null);
  useDialog(() => setModalOpen(false), modalOpen);

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

  const shown = filter === 'occupied' ? sorted.filter(h => h.planets.length > 0) : sorted;

  return (
    <div>
      <SectionHeader
        title="Houses"
        subtitle="Tap a planet to read what it means in that house and sign"
        right={
          <div className="w-full sm:w-56">
            <Segmented
              ariaLabel="Which houses to show"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All 12' },
                { value: 'occupied', label: 'With planets' },
              ]}
            />
          </div>
        }
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {shown.map(h => {
          const hasPlanets = h.planets.length > 0;
          return (
            <li key={h.house}>
              <Card className="flex h-full flex-col gap-3">
                <div className="flex items-start gap-3">
                  <HouseBadge house={h.house} active={hasPlanets} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold text-amber-800 dark:text-amber-200">{h.mainTheme}</p>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      {h.sign} · lord {PLANET_SYMBOL[h.signLord] ?? ''} {h.signLord}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => analyzeHouse(h.house)}
                    disabled={loading}
                    aria-label={`AI reading for house ${h.house}`}
                    className="flex h-10 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-semibold text-violet-800 ring-1 ring-inset ring-violet-400/40 transition hover:bg-violet-500/10 disabled:opacity-40 dark:text-violet-200"
                  >
                    ✦ AI
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-white/55">{h.represents}</p>
                {hasPlanets ? (
                  <ul className="flex flex-col gap-1.5">
                    {h.planets.map(p => (
                      <li key={p.planet}>
                        <button
                          type="button"
                          onClick={() => setMeaningPayload({ planet: p.planet, house: h.house, sign: h.sign })}
                          className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-slate-500/[0.06] px-3 py-2 text-left transition hover:bg-amber-400/10"
                        >
                          <span aria-hidden className="text-xl leading-none">{PLANET_SYMBOL[p.planet] ?? '•'}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold">{p.planet}</span>
                              <span className="text-xs tabular-nums text-slate-500 dark:text-white/45">{p.degreeInSign.toFixed(1)}°</span>
                              {p.isRetrograde && <Retro />}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-1">
                              <RelTag rel={p.relationship} lord={h.signLord} />
                              <DignityTag dignity={p.dignity} />
                            </span>
                          </span>
                          <span aria-hidden className="text-slate-400">›</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed px-3 py-2 text-xs text-slate-500 dark:text-white/40" style={{ borderColor: 'var(--app-border-strong)' }}>
                    No planets in this house
                  </p>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      {meaningPayload && (
        <PlacementMeaningModal payload={meaningPayload} onClose={() => setMeaningPayload(null)} />
      )}

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
