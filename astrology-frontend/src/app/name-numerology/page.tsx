'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface NameNumerologyResult {
  name: string;
  compound: number;
  single: number;
  meaning: { title: string; keywords: string };
}

interface DomainCheckResult {
  domain: string;
  available: boolean | null;
  error?: string;
}

// Mirrors astrology-backend/src/astrology/numerology.ts CHALDEAN map.
// 9 is never assigned to a letter in the Chaldean system.
const CHALDEAN_GROUPS: { value: number; letters: string[] }[] = [
  { value: 1, letters: ['A', 'I', 'J', 'Q', 'Y'] },
  { value: 2, letters: ['B', 'K', 'R'] },
  { value: 3, letters: ['C', 'G', 'L', 'S'] },
  { value: 4, letters: ['D', 'M', 'T'] },
  { value: 5, letters: ['E', 'H', 'N', 'X'] },
  { value: 6, letters: ['U', 'V', 'W'] },
  { value: 7, letters: ['O', 'Z'] },
  { value: 8, letters: ['F', 'P'] },
];

function ChaldeanLetterTable({ activeLetters }: { activeLetters: Set<string> }) {
  return (
    <section className="app-card p-5 lg:sticky lg:top-20">
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">
        Chaldean Letter Values
      </h2>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/40">
            <th className="border-b border-slate-200/90 pb-2 pr-3 font-medium dark:border-white/10">Value</th>
            <th className="border-b border-slate-200/90 pb-2 font-medium dark:border-white/10">Letters</th>
          </tr>
        </thead>
        <tbody>
          {CHALDEAN_GROUPS.map(({ value, letters }) => (
            <tr key={value} className="border-b border-slate-200/70 last:border-0 dark:border-white/5">
              <td className="py-2 pr-3 align-top font-semibold text-amber-600 tabular-nums dark:text-amber-300">
                {value}
              </td>
              <td className="py-2">
                <div className="flex flex-wrap gap-1">
                  {letters.map(letter => {
                    const isActive = activeLetters.has(letter);
                    return (
                      <span
                        key={letter}
                        className={[
                          'inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-medium transition',
                          isActive
                            ? 'bg-amber-500 text-white shadow-sm dark:bg-amber-400/90 dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60',
                        ].join(' ')}
                      >
                        {letter}
                      </span>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-white/40">
        9 is never assigned to a letter in the Chaldean system — it's reserved as a sacred number.
      </p>
    </section>
  );
}

export default function NameNumerologyPage() {
  const [name, setName] = useState('');
  const [checkDomain, setCheckDomain] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NameNumerologyResult | null>(null);
  const [domain, setDomain] = useState<DomainCheckResult | null>(null);

  const activeLetters = new Set(name.toUpperCase().replace(/[^A-Z]/g, '').split(''));

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setDomain(null);
    setLoading(true);
    try {
      const calcPromise = api.get<NameNumerologyResult>(
        `/name-numerology/calculate?name=${encodeURIComponent(name)}`,
      );
      const domainPromise = checkDomain
        ? api.get<DomainCheckResult>(`/name-numerology/domain-check?name=${encodeURIComponent(name)}`)
        : null;

      const calcRes = await calcPromise;
      setResult(calcRes.data);

      if (domainPromise) {
        const domainRes = await domainPromise;
        setDomain(domainRes.data);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Request failed. Please try again.';
      setError(Array.isArray(message) ? message.join(', ') : message);
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
      <main className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Name Numerology
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-white/55">
              Chaldean name number calculator, plus .com domain availability.
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-lg border border-slate-300/90 px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
          >
            ← Birth chart
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <form onSubmit={run} className="app-card mb-10 p-5">
              <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-white/50">
                Name
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Amelia"
                  className="app-input py-2 text-sm dark:bg-slate-900/80 dark:text-white"
                  required
                />
              </label>

              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-white/60">
                <input
                  type="checkbox"
                  checked={checkDomain}
                  onChange={e => setCheckDomain(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-white/20"
                />
                Also check .com domain availability
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50 dark:border-amber-400/50 dark:bg-amber-400/15 dark:text-amber-200 dark:hover:bg-amber-400/25"
              >
                {loading ? 'Calculating…' : 'Calculate'}
              </button>
            </form>

            {error && (
              <p className="mb-6 rounded-xl bg-red-100 p-4 text-red-900 dark:bg-red-500/20 dark:text-red-200">
                {error}
              </p>
            )}

            {result && (
              <div className="space-y-6 text-slate-800 dark:text-white/85">
                <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                  <h2 className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">
                    Chaldean Name Number
                  </h2>
                  <p className="mt-3 text-4xl font-semibold text-amber-600 dark:text-amber-300">
                    {result.single}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-white/45">
                    Compound total: {result.compound} → reduced to {result.single}
                  </p>
                  <p className="mt-4 text-lg font-medium">{result.meaning.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-white/60">{result.meaning.keywords}</p>
                </section>

                {domain && (
                  <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <h2 className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">
                      Domain Availability
                    </h2>
                    <p className="mt-3 text-lg font-medium">{domain.domain}</p>
                    {domain.available === true && (
                      <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        ✓ Available
                      </p>
                    )}
                    {domain.available === false && (
                      <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
                        ✗ Already registered
                      </p>
                    )}
                    {domain.available === null && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-white/45">
                        Could not determine availability{domain.error ? ` (${domain.error})` : ''}.
                      </p>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>

          <ChaldeanLetterTable activeLetters={activeLetters} />
        </div>
      </main>
    </div>
  );
}
