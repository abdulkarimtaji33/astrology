'use client';

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
  Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀',
  Mars:'♂', Jupiter:'♃', Saturn:'♄', Rahu:'☊', Ketu:'☋',
};

const REL_LABEL: Record<string, string> = {
  own: 'Own', friendly: 'Friend', enemy: 'Enemy', neutral: 'Neutral',
};

// ─── component ────────────────────────────────────────────────────────────
export default function HouseTable({ houses }: { houses: HouseDetail[] }) {
  const sorted = [...houses].sort((a, b) => a.house - b.house);

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
                          {p.isRetrograde && <span className="opacity-70">ᴿ</span>}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
