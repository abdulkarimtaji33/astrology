'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface RelationshipsData {
  planets: string[];
  relationships: Record<string, Record<string, 'friendly' | 'enemy' | 'neutral'>>;
}

const PLANET_SYMBOL: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const PLANET_COLOR: Record<string, string> = {
  Sun:     'text-amber-300',
  Moon:    'text-slate-200',
  Mars:    'text-red-400',
  Mercury: 'text-emerald-300',
  Jupiter: 'text-yellow-300',
  Venus:   'text-pink-300',
  Saturn:  'text-indigo-300',
  Rahu:    'text-purple-300',
  Ketu:    'text-orange-300',
};

const REL_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  friendly: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-300', dot: 'bg-emerald-400', label: 'Friend' },
  enemy:    { bg: 'bg-red-500/15 border-red-500/30',         text: 'text-red-300',     dot: 'bg-red-400',     label: 'Enemy'  },
  neutral:  { bg: 'bg-white/5 border-white/10',              text: 'text-white/40',    dot: 'bg-white/20',    label: 'Neutral'},
  self:     { bg: 'bg-white/5 border-white/5',               text: 'text-white/20',    dot: 'bg-white/10',    label: '—'      },
};

function RelCell({ rel, isSelf }: { rel: 'friendly' | 'enemy' | 'neutral'; isSelf: boolean }) {
  const style = isSelf ? REL_STYLE.self : REL_STYLE[rel];
  return (
    <div className={`flex items-center justify-center rounded-lg border ${style.bg} h-10`}>
      <span className={`text-[11px] font-medium ${style.text}`}>{isSelf ? '—' : style.label}</span>
    </div>
  );
}

export default function PlanetRelationshipsPanel() {
  const { data, isLoading, isError } = useQuery<RelationshipsData>({
    queryKey: ['planet-relationships'],
    queryFn: () => api.get<RelationshipsData>('/birth-records/planet-relationships').then(r => r.data),
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="rounded-xl bg-red-500/20 p-4 text-sm text-red-200">Failed to load planet relationships.</p>;
  }

  const { planets, relationships } = data;

  // Summary cards per planet
  const summaries = planets.map(p => {
    const friends = planets.filter(q => q !== p && relationships[p]?.[q] === 'friendly');
    const enemies = planets.filter(q => q !== p && relationships[p]?.[q] === 'enemy');
    const neutrals = planets.filter(q => q !== p && relationships[p]?.[q] === 'neutral');
    return { planet: p, friends, enemies, neutrals };
  });

  return (
    <div className="flex flex-col gap-8">

      {/* ── Matrix ── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 overflow-x-auto">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
          Naisargika Maitri · Natural Friendship Matrix
        </h3>

        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `100px repeat(${planets.length}, minmax(72px, 1fr))` }}
        >
          {/* Header row */}
          <div />
          {planets.map(p => (
            <div key={p} className="flex flex-col items-center gap-0.5 pb-2">
              <span className={`text-lg ${PLANET_COLOR[p] ?? 'text-white'}`}>{PLANET_SYMBOL[p] ?? p[0]}</span>
              <span className="text-[10px] text-white/50">{p}</span>
            </div>
          ))}

          {/* Data rows */}
          {planets.map(row => (
            <>
              {/* Row label */}
              <div key={`label-${row}`} className="flex items-center gap-2 pr-2">
                <span className={`text-base ${PLANET_COLOR[row] ?? 'text-white'}`}>{PLANET_SYMBOL[row] ?? row[0]}</span>
                <span className="text-xs text-white/70">{row}</span>
              </div>

              {/* Cells */}
              {planets.map(col => (
                <RelCell
                  key={`${row}-${col}`}
                  rel={relationships[row]?.[col] ?? 'neutral'}
                  isSelf={row === col}
                />
              ))}
            </>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {(['friendly', 'enemy', 'neutral'] as const).map(r => (
            <div key={r} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${REL_STYLE[r].dot}`} />
              <span className="text-xs text-white/50 capitalize">{REL_STYLE[r].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map(({ planet, friends, enemies, neutrals }) => (
          <div key={planet} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className={`text-2xl ${PLANET_COLOR[planet] ?? 'text-white'}`}>{PLANET_SYMBOL[planet]}</span>
              <span className="text-sm font-semibold text-white">{planet}</span>
            </div>

            {friends.length > 0 && (
              <div className="mb-2">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">Friends</p>
                <div className="flex flex-wrap gap-1">
                  {friends.map(f => (
                    <span key={f} className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[11px] text-emerald-300">
                      <span>{PLANET_SYMBOL[f]}</span> {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {enemies.length > 0 && (
              <div className="mb-2">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-red-400/70">Enemies</p>
                <div className="flex flex-wrap gap-1">
                  {enemies.map(e => (
                    <span key={e} className="flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/25 px-2 py-0.5 text-[11px] text-red-300">
                      <span>{PLANET_SYMBOL[e]}</span> {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {neutrals.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Neutral</p>
                <div className="flex flex-wrap gap-1">
                  {neutrals.map(n => (
                    <span key={n} className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-white/40">
                      <span>{PLANET_SYMBOL[n]}</span> {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
