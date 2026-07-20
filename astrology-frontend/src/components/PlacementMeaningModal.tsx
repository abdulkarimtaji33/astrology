'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const PLANET_SYMBOL: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

interface PlacementMeaningResponse {
  planet: string;
  house: number | null;
  sign: string | null;
  houseMeaning: string | null;
  signMeaning: string | null;
}

/** Renders the guide's lightweight markdown: `**Heading**` and `* bullet` lines. */
function MeaningBody({ text }: { text: string }) {
  const blocks: { heading: string; items: string[] }[] = [];
  let current: { heading: string; items: string[] } | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const headingMatch = /^\*\*(.+)\*\*$/.exec(line);
    if (headingMatch) {
      current = { heading: headingMatch[1], items: [] };
      blocks.push(current);
      continue;
    }
    const bulletMatch = /^\*\s+(.*)$/.exec(line);
    const content = bulletMatch ? bulletMatch[1] : line;
    if (!current) {
      current = { heading: '', items: [] };
      blocks.push(current);
    }
    current.items.push(content);
  }

  return (
    <div className="space-y-4">
      {blocks.map((b, i) => (
        <div key={i}>
          {b.heading && (
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300/90">
              {b.heading}
            </h4>
          )}
          <ul className="list-disc space-y-1 pl-4">
            {b.items.map((item, j) => (
              <li key={j} className="text-sm leading-relaxed text-slate-700 dark:text-white/75">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export interface PlacementMeaningPayload {
  planet: string;
  house: number;
  sign: string;
}

export default function PlacementMeaningModal({
  payload,
  onClose,
}: {
  payload: PlacementMeaningPayload;
  onClose: () => void;
}) {
  const { planet, house, sign } = payload;

  const { data, isLoading, isError } = useQuery<PlacementMeaningResponse>({
    queryKey: ['placement-meaning', planet, house, sign],
    queryFn: () =>
      api
        .get<PlacementMeaningResponse>(
          `/placement-meanings?planet=${encodeURIComponent(planet)}&house=${house}&sign=${encodeURIComponent(sign)}`,
        )
        .then(r => r.data),
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-amber-400/20 bg-white dark:bg-[#0d0d1c] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200/70 px-5 pb-4 pt-5 dark:border-white/8">
          <div>
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              <span className="mr-1.5 text-base">{PLANET_SYMBOL[planet] ?? ''}</span>
              {planet} — House {house} in {sign}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-white/40">
              What {planet} means in the {house}{ordinalSuffix(house)} house, and what it means in {sign}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-lg leading-none text-slate-500 hover:text-slate-700 dark:text-white/30 dark:hover:text-white/60"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <p className="text-sm text-slate-500 dark:text-white/40">Loading meaning…</p>
          )}
          {isError && (
            <p className="text-sm text-red-500 dark:text-red-400">Failed to load meaning. Please try again.</p>
          )}
          {data && (
            <div className="space-y-6">
              <section>
                <h3 className="mb-3 border-l-2 border-amber-500/60 pl-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:border-amber-400/50 dark:text-white/40">
                  {planet} in the {house}{ordinalSuffix(house)} House
                </h3>
                {data.houseMeaning ? (
                  <MeaningBody text={data.houseMeaning} />
                ) : (
                  <p className="text-sm text-slate-400 dark:text-white/30">No house interpretation available.</p>
                )}
              </section>

              <section>
                <h3 className="mb-3 border-l-2 border-indigo-500/60 pl-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:border-indigo-400/50 dark:text-white/40">
                  {planet} in {sign}
                </h3>
                {data.signMeaning ? (
                  <MeaningBody text={data.signMeaning} />
                ) : (
                  <p className="text-sm text-slate-400 dark:text-white/30">No sign interpretation available.</p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
