'use client';

import type { ChartData } from '@/app/chart/[id]/page';

/**
 * North-Indian style diamond lagna chart (4×4 grid with corners cut).
 *
 * House layout (North-Indian style):
 *
 *  ┌────┬────┬────┐
 *  │ 12 │  1 │  2 │
 *  ├────┼────┼────┤
 *  │ 11 │ Lg │  3 │
 *  ├────┼────┼────┤
 *  │ 10 │  9 │  8 │  (actual layout differs – see HOUSE_CELLS)
 *  └────┴────┴────┘
 *
 * The standard North-Indian 3x3 diamond layout:
 *
 *   (0,0)12  (1,0)1   (2,0)2
 *   (0,1)11  center   (2,1)3
 *   (0,2)10  (1,2)9   (2,2)8  ← but corner houses are triangles
 *
 * We use a 4×4 SVG grid where each cell is 100px.
 * Triangular corner cells and rectangular side cells.
 */

const SIZE = 400;
const C = SIZE / 2;   // centre = 200
const Q = SIZE / 4;   // quarter = 100

// Clip-path polygons for each of the 12 houses in North-Indian style
// Coordinates as [x, y] pairs, normalized to a 400×400 SVG
const HOUSE_POLYGONS: Record<number, [number, number][]> = {
  // Top row
  1:  [[Q, 0], [C, 0], [C, Q], [Q, Q]],                // top-left rect
  2:  [[C, 0], [3*Q, 0], [3*Q, Q], [C, Q]],             // top-right rect
  // Right column
  3:  [[3*Q, 0], [SIZE, 0], [SIZE, Q], [3*Q, Q]],        // top-right corner → triangle
  // actually North-Indian uses diamond. Let me use the true diamond layout:
  // Lagna = top-centre triangle
};

// ─── TRUE North-Indian diamond layout (triangular cells) ──────────────────
// The chart is a square divided into 12 triangular/trapezoidal regions.
// House 1 = top triangle (Lagna), going clockwise.

const DIAMOND_HOUSES: Record<number, [number, number][]> = {
  1:  [[Q, 0], [3*Q, 0], [C, Q]],                          // top triangle
  2:  [[3*Q, 0], [SIZE, 0], [SIZE, Q], [C, Q]],             // top-right
  3:  [[SIZE, 0], [SIZE, Q], [3*Q, C], [SIZE, 3*Q]],        // right top
  // Fix: standard North-Indian layout
};

// Standard North-Indian Kundali: 12 cells around a central square.
// Using a 3×3 grid with 4 triangles at corners and 4 rectangles on sides.
// House assignments (fixed, Lagna is house 1 at top-right of centre, going clockwise):
//
//  [12][1][2]        top row
//  [11][  ][3]       middle row
//  [10][9][8]        but really it's
//       [7][6][5]    wait – standard is:
//
// Standard North-Indian house positions (anti-clockwise from top-centre):
//  Top-centre: 1, going right→down (clockwise):
//  1=top-centre, 2=top-right, 3=right-centre, 4=bottom-right, 5=bottom-centre,
//  6=bottom-left, 7=left-centre-bottom, 8=left-bottom, 9=bottom-left-corner,
//  ...
//
// Let me use the universally accepted 4-column, diamond grid:
//
// Positions in a 4×4 grid (each cell = SIZE/4):
//  Row0: [_][1][2][_]
//  Row1: [12][X][X][3]
//  Row2: [11][X][X][4]
//  Row3: [_][10][5][_]   ← wait that's 10 cells not 12
//
// The correct North-Indian 4×4:
//  Row0: [12][1][2][3]
//  Row1: [11][La][La][4]
//  Row2: [10][La][La][5]
//  Row3: [9][8][7][6]
//
// Where La = central 2×2 Lagna box (houses shown as triangles at corners)
// Actually the 12 houses surround the central box — no diagonal cuts in this variant.
// Let's use rectangular cells in 4×4 grid (simplest, clearest on screen):

type Cell = { col: number; row: number; houseNum: number };

// house → grid cell (0-indexed col, row in a 4×4 grid)
const GRID_CELLS: Cell[] = [
  { col: 1, row: 0, houseNum: 1 },
  { col: 2, row: 0, houseNum: 2 },
  { col: 3, row: 0, houseNum: 3 },
  { col: 3, row: 1, houseNum: 4 },
  { col: 3, row: 2, houseNum: 5 },
  { col: 3, row: 3, houseNum: 6 },
  { col: 2, row: 3, houseNum: 7 },
  { col: 1, row: 3, houseNum: 8 },
  { col: 0, row: 3, houseNum: 9 },
  { col: 0, row: 2, houseNum: 10 },
  { col: 0, row: 1, houseNum: 11 },
  { col: 0, row: 0, houseNum: 12 },
];

const DIGNITY_COLORS: Record<string, string> = {
  own: '#fbbf24',
  exalted: '#34d399',
  debilitated: '#f87171',
  neutral: '#c4b5fd',
};

const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mercury: 'Me', Venus: 'Ve',
  Mars: 'Ma', Jupiter: 'Ju', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

interface Props {
  chart: ChartData;
}

export default function LagnaChartSVG({ chart }: Props) {
  const cellSize = SIZE / 4;

  // Build a map: houseNum → display lines
  const houseContent: Record<number, { lines: string[]; colors: string[] }> = {};
  for (let h = 1; h <= 12; h++) {
    houseContent[h] = { lines: [], colors: [] };
  }

  for (const p of chart.planets) {
    const abbr = (PLANET_ABBR[p.planet] ?? p.planet) + (p.isRetrograde ? 'ʀ' : '');
    const deg = p.degreeInSign.toFixed(0) + '°';
    houseContent[p.house].lines.push(`${abbr} ${deg}`);
    houseContent[p.house].colors.push(DIGNITY_COLORS[p.dignity]);
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      height="100%"
      style={{ aspectRatio: '1/1' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width={SIZE} height={SIZE} fill="transparent" />

      {/* Central 2×2 lagna box */}
      <rect
        x={cellSize}
        y={cellSize}
        width={cellSize * 2}
        height={cellSize * 2}
        fill="rgba(99,102,241,0.08)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      <text
        x={C}
        y={C - 12}
        textAnchor="middle"
        fill="rgba(251,191,36,0.9)"
        fontSize="13"
        fontWeight="600"
        fontFamily="system-ui,sans-serif"
      >
        {chart.lagna.sign}
      </text>
      <text
        x={C}
        y={C + 6}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize="10"
        fontFamily="system-ui,sans-serif"
      >
        Lagna
      </text>
      <text
        x={C}
        y={C + 20}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize="9"
        fontFamily="system-ui,sans-serif"
      >
        {chart.lagna.degreeInSign.toFixed(1)}°
      </text>

      {/* 12 house cells */}
      {GRID_CELLS.map(({ col, row, houseNum }) => {
        const x = col * cellSize;
        const y = row * cellSize;
        const houseInfo = chart.houses[houseNum - 1];
        const content = houseContent[houseNum];
        const isCorner = (col === 0 || col === 3) && (row === 0 || row === 3);

        return (
          <g key={houseNum}>
            <rect
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              fill={isCorner ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)'}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.75"
            />
            {/* House number */}
            <text
              x={x + 5}
              y={y + 13}
              fill="rgba(255,255,255,0.25)"
              fontSize="9"
              fontFamily="system-ui,sans-serif"
            >
              {houseNum}
            </text>
            {/* Sign name */}
            <text
              x={x + cellSize / 2}
              y={y + 24}
              textAnchor="middle"
              fill="rgba(165,180,252,0.7)"
              fontSize="9"
              fontFamily="system-ui,sans-serif"
            >
              {houseInfo?.sign ?? ''}
            </text>
            {/* Planets */}
            {content.lines.map((line, i) => (
              <text
                key={i}
                x={x + cellSize / 2}
                y={y + 38 + i * 14}
                textAnchor="middle"
                fill={content.colors[i]}
                fontSize="11"
                fontWeight="500"
                fontFamily="system-ui,sans-serif"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
