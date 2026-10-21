'use client';

import { useState } from 'react';
import PlacementMeaningModal, { PlacementMeaningPayload } from './PlacementMeaningModal';
import { Card, DignityTag, ElementTag, PlanetGlyph, Retro, SectionHeader, Tag } from './placement-ui';

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







export default function PlanetTable({ planets }: { planets: PlanetPosition[] }) {
  const [meaningPayload, setMeaningPayload] = useState<PlacementMeaningPayload | null>(null);

  return (
    <div>
      {meaningPayload && (
        <PlacementMeaningModal payload={meaningPayload} onClose={() => setMeaningPayload(null)} />
      )}
      <SectionHeader title="Planets" subtitle="Tap a planet for its meaning in that house and sign" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {planets.map(p => (
          <li key={p.planet}>
            <Card onClick={() => setMeaningPayload({ planet: p.planet, house: p.house, sign: p.sign })} className="flex h-full gap-3">
              <PlanetGlyph planet={p.planet} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold">{p.planet}</span>
                  {p.isRetrograde && <Retro />}
                  <span className="chip ml-auto">House {p.house}</span>
                </span>
                <span className="mt-0.5 block text-sm">
                  <span className="font-medium text-indigo-800 dark:text-indigo-200">{p.sign}</span>{' '}
                  <span className="tabular-nums text-slate-500 dark:text-white/45">{p.degreeInSign.toFixed(2)}°</span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1">
                  <DignityTag dignity={p.dignity} />
                  <ElementTag sign={p.sign} />
                  {p.avastha?.englishName && (
                    <Tag tone="violet" title={p.avastha.name ?? undefined}>
                      {p.avastha.englishName}
                      {p.avastha.effectPercent != null ? ` · ${p.avastha.effectPercent}%` : ''}
                    </Tag>
                  )}
                </span>
                <span className="mt-2 block text-xs font-semibold text-amber-700 dark:text-amber-300">Read meaning ›</span>
              </span>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
