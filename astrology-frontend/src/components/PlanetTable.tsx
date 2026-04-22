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

const DIGNITY_BADGE: Record<string, string> = {
  own:        'bg-amber-400/20 text-amber-300',
  exalted:    'bg-emerald-400/20 text-emerald-300',
  debilitated:'bg-red-400/20 text-red-300',
  neutral:    'bg-white/10 text-white/50',
};

const PLANET_SYMBOL: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

export default function PlanetTable({ planets }: { planets: PlanetPosition[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-white/40">
          Planetary Positions
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-white/30 uppercase tracking-wider">
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
                className="border-b border-white/5 transition hover:bg-white/5"
              >
                <td className="px-5 py-2.5 font-medium text-white/90">
                  <span className="mr-2 text-base">{PLANET_SYMBOL[p.planet] ?? ''}</span>
                  {p.planet}
                  {p.isRetrograde && (
                    <span className="ml-1.5 rounded bg-orange-400/20 px-1 py-0.5 text-[10px] text-orange-300">
                      ℞
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-indigo-300">{p.sign}</td>
                <td className="px-3 py-2.5 tabular-nums text-white/60">
                  {p.degreeInSign.toFixed(2)}°
                </td>
                <td className="px-3 py-2.5 tabular-nums text-white/60">{p.house}</td>
                <td className="px-3 py-2.5 max-w-[160px]">
                  {p.avastha?.englishName ? (
                    <span className="text-xs text-cyan-200/90" title={p.avastha.name ?? p.avastha.englishName}>
                      {p.avastha.englishName}
                    </span>
                  ) : (
                    <span className="text-white/25">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {p.avastha?.effectPercent != null ? (
                    <span
                      className="text-xs text-violet-200/90"
                      title={
                        p.avastha.degreeFrom != null && p.avastha.degreeTo != null
                          ? `Degree in sign ${p.degreeInSign.toFixed(2)}° within ${p.avastha.degreeFrom}°–${p.avastha.degreeTo}°`
                          : undefined
                      }
                    >
                      {p.avastha.effectPercent}%
                    </span>
                  ) : (
                    <span className="text-white/25">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(p.dignity) ? p.dignity : [p.dignity]).map(d => (
                      <span key={d}
                        className={`rounded-full px-2 py-0.5 text-xs capitalize ${DIGNITY_BADGE[d] ?? 'bg-white/10 text-white/50'}`}
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
