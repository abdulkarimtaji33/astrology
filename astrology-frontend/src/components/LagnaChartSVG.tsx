'use client';

import type { ChartData } from '@/app/chart/[id]/page';

/**
 * North-Indian style Kundali chart.
 *
 * The square is divided into 12 cells using a 3×3 grid where the four
 * corner cells are each cut diagonally, giving 8 triangular corner houses
 * and 4 rectangular side houses around a central Lagna box.
 *
 * House positions (clockwise from top):
 *
 *   12╲  1  ╱2
 *   11  ╲╱  ╱3
 *      [Lg]
 *   10  ╱╲  ╲4
 *    9╱  7  ╲5
 *        8   6
 *
 *  ┌──────┬──────┬──────┐
 *  │ 12╲  │  1   │  ╱2  │
 *  │   11╲│      │╱3    │
 *  ├──────┼──────┼──────┤
 *  │  10  │ [Lg] │  4   │
 *  ├──────┼──────┼──────┤
 *  │   9╱ │  7   │╲5    │
 *  │  8╱  │      │  ╲6  │
 *  └──────┴──────┴──────┘
 */

const SIZE = 420;
const s    = SIZE / 3;          // cell width = 140 px

type Pt = [number, number];

// ─── House polygons ─────────────────────────────────────────────────────────
const HOUSE_POLY: Record<number, Pt[]> = {
  //  rectangle cells (4 sides)
  1:  [[s,0],    [2*s,0],   [2*s,s],   [s,s]],
  4:  [[2*s,s],  [3*s,s],   [3*s,2*s], [2*s,2*s]],
  7:  [[s,2*s],  [2*s,2*s], [2*s,3*s], [s,3*s]],
  10: [[0,s],    [s,s],     [s,2*s],   [0,2*s]],

  // triangle cells — TL corner: diagonal (s,0)→(0,s)
  12: [[0,0],    [s,0],     [0,s]],
  11: [[s,0],    [s,s],     [0,s]],

  // TR corner: diagonal (3s,0)→(2s,s)
  2:  [[2*s,0],  [3*s,0],   [2*s,s]],
  3:  [[3*s,0],  [3*s,s],   [2*s,s]],

  // BR corner: diagonal (2s,2s)→(3s,3s)
  5:  [[2*s,2*s],[3*s,2*s], [3*s,3*s]],
  6:  [[2*s,2*s],[3*s,3*s], [2*s,3*s]],

  // BL corner: diagonal (0,2s)→(s,3s)  i.e. (s,2s)→(0,3s)
  8:  [[s,2*s],  [s,3*s],   [0,3*s]],
  9:  [[0,2*s],  [s,2*s],   [0,3*s]],
};

// Centroid of each house polygon for text anchoring
const HOUSE_CENTER: Record<number, Pt> = {
  1:  [1.5*s,       0.48*s],
  2:  [7*s/3,       s/3],
  3:  [8*s/3,       2*s/3],
  4:  [2.52*s,      1.5*s],
  5:  [8*s/3,       7*s/3],
  6:  [7*s/3,       8*s/3],
  7:  [1.5*s,       2.52*s],
  8:  [2*s/3,       8*s/3],
  9:  [s/3,         7*s/3],
  10: [0.48*s,      1.5*s],
  11: [2*s/3,       2*s/3],
  12: [s/3,         s/3],
};

const SIGN_ABBR: Record<string, string> = {
  Aries:'Ar', Taurus:'Ta', Gemini:'Ge', Cancer:'Cn', Leo:'Le', Virgo:'Vi',
  Libra:'Li', Scorpio:'Sc', Sagittarius:'Sg', Capricorn:'Cp', Aquarius:'Aq', Pisces:'Pi',
};

const PLANET_ABBR: Record<string, string> = {
  Sun:'Su', Moon:'Mo', Mercury:'Me', Venus:'Ve', Mars:'Ma',
  Jupiter:'Ju', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke',
};

const DIGNITY_COLOR: Record<string, string> = {
  own:        '#fbbf24',
  exalted:    '#34d399',
  debilitated:'#f87171',
  neutral:    '#c4b5fd',
};

const CELL_FILL = 'rgba(255,255,255,0.02)';
const CELL_STROKE = 'rgba(255,255,255,0.20)';
const CENTER_FILL = 'rgba(99,102,241,0.10)';

interface Props { chart: ChartData }

export default function LagnaChartSVG({ chart }: Props) {
  // house number → list of {label, color}
  const content: Record<number, { label: string; color: string }[]> = {};
  for (let h = 1; h <= 12; h++) content[h] = [];

  for (const p of chart.planets) {
    const abbr  = PLANET_ABBR[p.planet] ?? p.planet.slice(0, 2);
    const ret   = p.isRetrograde ? 'ᴿ' : '';
    const deg   = Math.floor(p.degreeInSign) + '°';
    content[p.house].push({ label: `${abbr}${ret} ${deg}`, color: DIGNITY_COLOR[p.dignity] });
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%" height="100%"
      style={{ aspectRatio: '1/1' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── 12 house cells ── */}
      {Object.entries(HOUSE_POLY).map(([hStr, pts]) => {
        const h      = Number(hStr);
        const [cx, cy] = HOUSE_CENTER[h];
        const sign   = chart.houses[h - 1]?.sign ?? '';
        const items  = content[h];
        const points = pts.map(([x, y]) => `${x},${y}`).join(' ');

        return (
          <g key={h}>
            <polygon
              points={points}
              fill={CELL_FILL}
              stroke={CELL_STROKE}
              strokeWidth="0.75"
            />

            {/* house number — small, near centroid offset */}
            <text
              x={cx} y={cy - 22}
              textAnchor="middle"
              fill="rgba(255,255,255,0.22)"
              fontSize="9"
              fontFamily="system-ui,sans-serif"
            >
              {h}
            </text>

            {/* sign abbreviation */}
            <text
              x={cx} y={cy - 10}
              textAnchor="middle"
              fill="rgba(165,180,252,0.80)"
              fontSize="10"
              fontFamily="system-ui,sans-serif"
              fontWeight="500"
            >
              {SIGN_ABBR[sign] ?? sign}
            </text>

            {/* planets */}
            {items.map(({ label, color }, i) => (
              <text
                key={i}
                x={cx} y={cy + 5 + i * 13}
                textAnchor="middle"
                fill={color}
                fontSize="10.5"
                fontWeight="600"
                fontFamily="system-ui,sans-serif"
              >
                {label}
              </text>
            ))}
          </g>
        );
      })}

      {/* ── Central Lagna box ── */}
      <rect
        x={s} y={s} width={s} height={s}
        fill={CENTER_FILL}
        stroke="rgba(251,191,36,0.35)"
        strokeWidth="1"
      />
      <text
        x={1.5*s} y={1.5*s - 14}
        textAnchor="middle"
        fill="rgba(251,191,36,0.95)"
        fontSize="12" fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        {chart.lagna.sign}
      </text>
      <text
        x={1.5*s} y={1.5*s + 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.45)"
        fontSize="9"
        fontFamily="system-ui,sans-serif"
      >
        Lagna
      </text>
      <text
        x={1.5*s} y={1.5*s + 16}
        textAnchor="middle"
        fill="rgba(255,255,255,0.30)"
        fontSize="9"
        fontFamily="system-ui,sans-serif"
      >
        {chart.lagna.degreeInSign.toFixed(1)}°
      </text>
    </svg>
  );
}
