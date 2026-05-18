'use client';

interface PlanetAvastha {
  name: string | null;
  englishName: string | null;
  effectPercent: number | null;
  degreeFrom: string | null;
  degreeTo: string | null;
}

interface PlanetPosition {
  planet: string;
  longitude: number;
  sign: string;
  signIndex: number;
  degreeInSign: number;
  house: number;
  isRetrograde: boolean;
  dignity: string[];
  avastha?: PlanetAvastha | null;
}

const SIGN_ELEMENT: Record<string, { label: string; cls: string }> = {
  Aries:       { label: 'Fire',  cls: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
  Leo:         { label: 'Fire',  cls: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
  Sagittarius: { label: 'Fire',  cls: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
  Taurus:      { label: 'Earth', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  Virgo:       { label: 'Earth', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  Capricorn:   { label: 'Earth', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  Gemini:      { label: 'Air',   cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
  Libra:       { label: 'Air',   cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
  Aquarius:    { label: 'Air',   cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
  Cancer:      { label: 'Water', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  Scorpio:     { label: 'Water', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  Pisces:      { label: 'Water', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
};

const DIGNITY_BADGE: Record<string, string> = {
  own: 'bg-amber-200/80 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300',
  exalted: 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-300',
  debilitated: 'bg-red-200/80 text-red-900 dark:bg-red-400/20 dark:text-red-300',
  neutral: 'bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-white/50',
};

const PLANET_SYMBOL: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

export default function PlanetTable({ planets }: { planets: PlanetPosition[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-xl">
      <div className="px-5 pb-3 pt-5">
        <h2 className="text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-white/40">
          Planetary Positions
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/90 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/10 dark:text-white/30">
              <th className="px-5 py-2">Planet</th>
              <th className="px-3 py-2">Sign</th>
              <th className="px-3 py-2">Degree</th>
              <th className="px-3 py-2">House</th>
              <th className="px-3 py-2">Avasthā</th>
              <th className="px-3 py-2">Strength</th>
              <th className="px-3 py-2">Dignity</th>
            </tr>
          </thead>
          <tbody>
            {planets.map((p) => (
              <tr
                key={p.planet}
                className="border-b border-slate-200/70 transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
              >
                <td className="px-5 py-2.5 font-medium text-slate-900 dark:text-white/90">
                  <span className="mr-2 text-base">{PLANET_SYMBOL[p.planet] ?? ''}</span>
                  {p.planet}
                  {p.isRetrograde && (
                    <span className="ml-1.5 rounded bg-orange-400/20 px-1 py-0.5 text-[10px] text-orange-700 dark:text-orange-300">
                      ℞
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-indigo-800 dark:text-indigo-300">{p.sign}</span>
                    {SIGN_ELEMENT[p.sign] && (
                      <span className={`inline-block w-fit rounded px-1.5 py-0 text-[10px] font-medium ${SIGN_ELEMENT[p.sign].cls}`}>
                        {SIGN_ELEMENT[p.sign].label}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-slate-600 dark:text-white/60">
                  {p.degreeInSign.toFixed(2)}°
                </td>
                <td className="px-3 py-2.5 tabular-nums text-slate-600 dark:text-white/60">{p.house}</td>
                <td className="max-w-[160px] px-3 py-2.5">
                  {p.avastha?.englishName ? (
                    <span className="text-xs text-cyan-800 dark:text-cyan-200/90" title={p.avastha.name ?? p.avastha.englishName}>
                      {p.avastha.englishName}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-white/25">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {p.avastha?.effectPercent != null ? (
                    <span
                      className="text-xs text-violet-800 dark:text-violet-200/90"
                      title={
                        p.avastha.degreeFrom != null && p.avastha.degreeTo != null
                          ? `Degree in sign ${p.degreeInSign.toFixed(2)}° within ${p.avastha.degreeFrom}°–${p.avastha.degreeTo}°`
                          : undefined
                      }
                    >
                      {p.avastha.effectPercent}%
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-white/25">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(p.dignity) ? p.dignity : [p.dignity]).map(d => (
                      <span
                        key={d}
                        className={`rounded-full px-2 py-0.5 text-xs capitalize ${DIGNITY_BADGE[d] ?? 'bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-white/50'}`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
