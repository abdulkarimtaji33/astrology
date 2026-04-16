'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

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
  const [error, setError] = useState(false);
  const [data, setData] = useState<WorldEventsResult | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setData(null);
    setLoading(true);
    try {
      const res = await api.get<WorldEventsResult>(
        `/world-events/predict?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { timeout: 10 * 60 * 1000 },
      );
      setData(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(251,191,36,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(99,102,241,0.2) 0%, transparent 50%)`,
        }}
      />
      <main className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              World Events
            </h1>
            <p className="mt-1 text-sm text-white/55">
              Mundane Vedic transit analysis — conjunctions, aspects, combustion.
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
          >
            ← Birth chart
          </Link>
        </div>

        <form onSubmit={run} className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-xs text-white/50">
              Start
              <input
                type="date"
                value={from}
                onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
                className="rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white"
                required
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-white/50">
              End
              <input
                type="date"
                value={to}
                onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
                className="rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border border-amber-400/50 bg-amber-400/15 px-5 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/25 disabled:opacity-50"
            >
              {loading ? 'Analyzing…' : 'Predict'}
            </button>
          </div>
        </form>

        {error && (
          <p className="rounded-xl bg-red-500/20 p-4 text-red-200">Request failed. Check dates and API key.</p>
        )}

        {data && (
          <div className="space-y-8 text-white/85">

            {/* Summary */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h2 className="text-xs font-medium uppercase tracking-widest text-white/40">Overview</h2>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed">{data.summary}</p>
            </section>

            {/* Major Themes */}
            {data.majorThemes?.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <h2 className="text-xs font-medium uppercase tracking-widest text-white/40">Major Themes</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  {data.majorThemes.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Topic Analysis */}
            {data.topicAnalysis?.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <h2 className="text-xs font-medium uppercase tracking-widest text-white/40">Topic Analysis</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {data.topicAnalysis.map((item, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold text-amber-200/90">
                        <span>{TOPIC_ICONS[item.topic] ?? '◆'}</span>
                        {item.topic}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/70">{item.assessment}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Monthly Highlights */}
            {data.monthlyHighlights?.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <h2 className="text-xs font-medium uppercase tracking-widest text-white/40">Timeline</h2>
                <ul className="mt-4 space-y-4">
                  {data.monthlyHighlights.map((m, i) => (
                    <li key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <p className="font-medium text-amber-200/90">{m.periodLabel}</p>
                      <p className="mt-1 text-sm text-white/75">{m.outlook}</p>
                      {m.focusAreas?.length > 0 && (
                        <p className="mt-2 text-xs text-white/45">{m.focusAreas.join(' · ')}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Planetary Movements */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h2 className="text-xs font-medium uppercase tracking-widest text-white/40">Planetary Movements</h2>
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/35">Sign Ingresses</h3>
                  <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-white/10 text-xs">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-900/95 text-[10px] uppercase text-white/40">
                        <tr>
                          <th className="px-2 py-1.5">Date</th>
                          <th className="px-2 py-1.5">Body</th>
                          <th className="px-2 py-1.5">From → To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.signIngresses?.length ? (
                          data.signIngresses.map((ev, i) => (
                            <tr key={i} className="border-t border-white/5">
                              <td className="px-2 py-1.5 tabular-nums text-white/55">{ev.date}</td>
                              <td className="px-2 py-1.5 text-white/80">{ev.planet}</td>
                              <td className="px-2 py-1.5 text-white/60">{ev.fromSign} → {ev.toSign}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} className="px-2 py-3 text-white/35">None in range</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/35">Retrograde / Direct</h3>
                  <p className="mt-1 text-[10px] text-white/35">Mercury through Saturn only.</p>
                  <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-white/10 text-xs">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-900/95 text-[10px] uppercase text-white/40">
                        <tr>
                          <th className="px-2 py-1.5">Date</th>
                          <th className="px-2 py-1.5">Body</th>
                          <th className="px-2 py-1.5">Station</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.retrogradeStations?.length ? (
                          data.retrogradeStations.map((ev, i) => (
                            <tr key={i} className="border-t border-white/5">
                              <td className="px-2 py-1.5 tabular-nums text-white/55">{ev.date}</td>
                              <td className="px-2 py-1.5 text-white/80">{ev.planet}</td>
                              <td className="px-2 py-1.5 text-white/60">{ev.toRetrograde ? 'Retrograde' : 'Direct'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} className="px-2 py-3 text-white/35">None in range</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Snapshot detail */}
            <details className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md open:bg-white/[0.07]">
              <summary className="cursor-pointer text-xs font-medium uppercase tracking-widest text-white/50">
                Planetary positions (sample dates) · Model: {data.model}
              </summary>
              <div className="mt-4 space-y-4">
                {data.snapshots?.map((s, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-white/65">
                    <p className="font-semibold text-white/50">{s.date}</p>
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
            <details className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md open:bg-white/[0.07]">
              <summary className="cursor-pointer text-xs font-medium uppercase tracking-widest text-white/50">
                Full AI Prompt
              </summary>
              <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-slate-950/80 p-3 text-[11px] leading-relaxed text-white/70">
                {data.aiPrompt}
              </pre>
            </details>

            {data.disclaimer && (
              <p className="text-center text-xs text-white/35">{data.disclaimer}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
