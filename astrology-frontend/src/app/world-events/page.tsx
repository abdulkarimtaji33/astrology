'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { isAxiosError } from 'axios';

interface PlanetState {
  planet: string;
  sign: string;
  degree: number;
  isRetrograde: boolean;
  dignity: string;
}

interface PlanetaryConjunction {
  planets: string[];
  sign: string;
  maxOrbDeg: number;
}

interface PlanetaryAspect {
  fromPlanet: string;
  toPlanet: string;
  aspectType: string;
}

interface CombustPlanet {
  planet: string;
  sign: string;
  orbFromSun: number;
}

interface WorldEventsSnapshot {
  date: string;
  planets: PlanetState[];
  conjunctions: PlanetaryConjunction[];
  aspects: PlanetaryAspect[];
  combustions: CombustPlanet[];
}

interface WorldEventsSignIngress {
  date: string;
  planet: string;
  fromSign: string;
  toSign: string;
}

interface WorldEventsRetroStation {
  date: string;
  planet: string;
  toRetrograde: boolean;
}

interface WorldEventsTopicAnalysis {
  topic: string;
  assessment: string;
}

interface WorldEventsResult {
  summary: string;
  majorThemes: string[];
  topicAnalysis: WorldEventsTopicAnalysis[];
  monthlyHighlights: { periodLabel: string; outlook: string; focusAreas: string[] }[];
  disclaimer: string;
  snapshots: WorldEventsSnapshot[];
  signIngresses: WorldEventsSignIngress[];
  retrogradeStations: WorldEventsRetroStation[];
  aiPrompt: string;
  model: string;
}

function defaultRange() {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

const TOPIC_ICONS: Record<string, string> = {
  'Wars & Conflicts': '⚔',
  'Economy & Inflation': '₿',
  'Global Markets': '📈',
  'Supply Chain & Trade': '🚢',
  'Communications & Technology': '📡',
  'Political Leadership & Reforms': '🏛',
  'Natural Disasters & Climate': '🌪',
  'Public Health': '⚕',
};

export default function WorldEventsPage() {
  const [{ from, to }, setRange] = useState(defaultRange);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WorldEventsResult | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const res = await api.get<WorldEventsResult>(
        `/world-events/predict?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { timeout: 10 * 60 * 1000 },
      );
      setData(res.data);
    } catch (err: unknown) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      const raw = isAxiosError(err) ? (err.response?.data as { message?: unknown } | undefined)?.message : undefined;
      const msg = typeof raw === 'string' ? raw : '';
      if (/credit|quota|billing|rate limit|429/i.test(msg)) {
        setError('The AI service is unavailable right now (usage limit reached). Please try again later.');
      } else if (!status) {
        setError('Could not reach the server. Check your connection and try again.');
      } else {
        setError('Something went wrong while predicting. Please try a shorter date range or try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell min-h-screen overflow-hidden">
      <div
        className="app-shell-glow opacity-50"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, var(--glow-2) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, var(--glow-1) 0%, transparent 50%)`,
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              World Events
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-white/55">
              Mundane Vedic transit analysis — conjunctions, aspects, combustion.
            </p>
          </div>
        </div>

        <form
          onSubmit={run}
          className="app-card mb-10 p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-xs text-slate-500 dark:text-white/50">
              Start
              <input
                type="date"
                value={from}
                onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
                className="app-input [color-scheme:light] dark:bg-slate-900/80 dark:text-white dark:[color-scheme:dark]"
                required
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-slate-500 dark:text-white/50">
              End
              <input
                type="date"
                value={to}
                onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
                className="app-input [color-scheme:light] dark:bg-slate-900/80 dark:text-white dark:[color-scheme:dark]"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary min-h-12 sm:min-h-11"
            >
              {loading ? 'Analyzing…' : 'Predict'}
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="mb-6 rounded-xl border border-red-300/60 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        )}

        {data && (
          <div className="space-y-8 text-slate-800 dark:text-white/85">

            {/* Summary */}
            <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <h2 className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">Overview</h2>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed">{data.summary}</p>
            </section>

            {/* Major Themes */}
            {data.majorThemes?.length > 0 && (
              <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <h2 className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">Major Themes</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  {data.majorThemes.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Topic Analysis */}
            {data.topicAnalysis?.length > 0 && (
              <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <h2 className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">Topic Analysis</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {data.topicAnalysis.map((item, i) => (
                    <div key={i} className="rounded-xl border border-slate-200/90 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-900/50">
                      <p className="flex items-center gap-2 text-sm font-semibold text-amber-200/90">
                        <span>{TOPIC_ICONS[item.topic] ?? '◆'}</span>
                        {item.topic}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/70">{item.assessment}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Monthly Highlights */}
            {data.monthlyHighlights?.length > 0 && (
              <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <h2 className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">Timeline</h2>
                <ul className="mt-4 space-y-4">
                  {data.monthlyHighlights.map((m, i) => (
                    <li key={i} className="border-b border-slate-200/80 pb-4 last:border-0 last:pb-0 dark:border-white/5">
                      <p className="font-medium text-amber-200/90">{m.periodLabel}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-white/75">{m.outlook}</p>
                      {m.focusAreas?.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-white/45">{m.focusAreas.join(' · ')}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Planetary Movements */}
            <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <h2 className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">Planetary Movements</h2>
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-white/35">Sign Ingresses</h3>
                  <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200/90 text-xs dark:border-white/10">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-100/95 text-[10px] uppercase text-slate-500 dark:bg-slate-900/95 dark:text-white/40">
                        <tr>
                          <th className="px-2 py-1.5">Date</th>
                          <th className="px-2 py-1.5">Body</th>
                          <th className="px-2 py-1.5">From → To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.signIngresses?.length ? (
                          data.signIngresses.map((ev, i) => (
                            <tr key={i} className="border-t border-slate-200/80 dark:border-white/5">
                              <td className="px-2 py-1.5 tabular-nums text-slate-600 dark:text-white/55">{ev.date}</td>
                              <td className="px-2 py-1.5 text-slate-800 dark:text-white/80">{ev.planet}</td>
                              <td className="px-2 py-1.5 text-slate-600 dark:text-white/60">{ev.fromSign} → {ev.toSign}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} className="px-2 py-3 text-slate-500 dark:text-white/35">None in range</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-white/35">Retrograde / Direct</h3>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-white/35">Mercury through Saturn only.</p>
                  <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200/90 text-xs dark:border-white/10">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-100/95 text-[10px] uppercase text-slate-500 dark:bg-slate-900/95 dark:text-white/40">
                        <tr>
                          <th className="px-2 py-1.5">Date</th>
                          <th className="px-2 py-1.5">Body</th>
                          <th className="px-2 py-1.5">Station</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.retrogradeStations?.length ? (
                          data.retrogradeStations.map((ev, i) => (
                            <tr key={i} className="border-t border-slate-200/80 dark:border-white/5">
                              <td className="px-2 py-1.5 tabular-nums text-slate-600 dark:text-white/55">{ev.date}</td>
                              <td className="px-2 py-1.5 text-slate-800 dark:text-white/80">{ev.planet}</td>
                              <td className="px-2 py-1.5 text-slate-600 dark:text-white/60">{ev.toRetrograde ? 'Retrograde' : 'Direct'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} className="px-2 py-3 text-slate-500 dark:text-white/35">None in range</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Snapshot detail */}
            <details className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:open:bg-white/[0.07]">
              <summary className="cursor-pointer text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/50">
                Planetary positions (sample dates) · Model: {data.model}
              </summary>
              <div className="mt-4 space-y-4">
                {data.snapshots?.map((s, i) => (
                  <div key={i} className="rounded-lg border border-slate-200/90 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-white/65">
                    <p className="font-semibold text-slate-500 dark:text-white/50">{s.date}</p>
                    <p className="mt-1">{s.planets.map(p => `${p.planet}${p.isRetrograde ? 'R' : ''} ${p.sign} ${p.degree.toFixed(1)}° [${p.dignity}]`).join(' · ')}</p>
                    {s.conjunctions.length > 0 && (
                      <p className="mt-1 text-amber-300/60">Conj: {s.conjunctions.map(c => `${c.planets.join('+')} in ${c.sign}`).join('; ')}</p>
                    )}
                    {s.combustions.length > 0 && (
                      <p className="mt-1 text-red-300/60">Combust: {s.combustions.map(c => `${c.planet} (${c.orbFromSun.toFixed(1)}° from Sun)`).join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </details>

            {/* Full prompt */}
            <details className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:open:bg-white/[0.07]">
              <summary className="cursor-pointer text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/50">
                Full AI Prompt
              </summary>
              <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200/90 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700 dark:border-white/10 dark:bg-slate-950/80 dark:text-white/70">
                {data.aiPrompt}
              </pre>
            </details>

            {data.disclaimer && (
              <p className="text-center text-xs text-slate-500 dark:text-white/35">{data.disclaimer}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
