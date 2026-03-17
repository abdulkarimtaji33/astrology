'use client';

import type { ChartData } from '@/app/chart/[id]/page';

// ─── Shared helpers ────────────────────────────────────────────────────────
type Pt = [number, number];

const SIGN_ABBR: Record<string, string> = {
  Aries:'Ar', Taurus:'Ta', Gemini:'Ge', Cancer:'Cn', Leo:'Le', Virgo:'Vi',
  Libra:'Li', Scorpio:'Sc', Sagittarius:'Sg', Capricorn:'Cp', Aquarius:'Aq', Pisces:'Pi',
};
const PLANET_ABBR: Record<string, string> = {
  Sun:'Su', Moon:'Mo', Mercury:'Me', Venus:'Ve', Mars:'Ma',
  Jupiter:'Ju', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke',
};
const DIGNITY_COLOR: Record<string, string> = {
  own:'#fbbf24', exalted:'#34d399', debilitated:'#f87171', neutral:'#c4b5fd',
};

function pts(pairs: Pt[]) { return pairs.map(([x,y]) => `${x},${y}`).join(' '); }

function centroid(poly: Pt[]): Pt {
  const n = poly.length;
  return [poly.reduce((s,[x])=>s+x,0)/n, poly.reduce((s,[,y])=>s+y,0)/n];
}

function buildContent(chart: ChartData) {
  const content: Record<number, {label:string; color:string}[]> = {};
  for (let h=1;h<=12;h++) content[h]=[];
  for (const p of chart.planets) {
    const abbr = PLANET_ABBR[p.planet] ?? p.planet.slice(0,2);
    const ret  = p.isRetrograde ? 'ᴿ' : '';
    const deg  = Math.floor(p.degreeInSign)+'°';
    const dignityKey = p.dignity.includes('exalted') ? 'exalted'
      : p.dignity.includes('debilitated') ? 'debilitated'
      : p.dignity.includes('own') ? 'own' : 'neutral';
    content[p.house].push({ label:`${abbr}${ret} ${deg}`, color: DIGNITY_COLOR[dignityKey] });
  }
  return content;
}

// ─── Cell renderer ─────────────────────────────────────────────────────────
function HouseCell({
  house, poly, sign, items, isLagna = false,
}: {
  house: number; poly: Pt[]; sign: string;
  items: {label:string;color:string}[];
  isLagna?: boolean;
}) {
  const [cx, cy] = centroid(poly);
  const lineH = 13;
  // stack: house#, sign, planets
  const totalLines = 1 + items.length;
  const startY = cy - ((totalLines - 1) * lineH) / 2 - 6;

  return (
    <g>
      <polygon
        points={pts(poly)}
        fill={isLagna ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.02)'}
        stroke={isLagna ? 'rgba(251,191,36,0.45)' : 'rgba(255,255,255,0.18)'}
        strokeWidth="0.8"
      />
      {/* house number */}
      <text x={cx} y={startY}
        textAnchor="middle" fill="rgba(255,255,255,0.22)"
        fontSize="8.5" fontFamily="system-ui,sans-serif">
        {house}
      </text>
      {/* sign */}
      <text x={cx} y={startY + lineH}
        textAnchor="middle" fill="rgba(165,180,252,0.85)"
        fontSize="10" fontWeight="500" fontFamily="system-ui,sans-serif">
        {SIGN_ABBR[sign] ?? sign}
      </text>
      {/* planets */}
      {items.map(({label,color},i) => (
        <text key={i} x={cx} y={startY + lineH * (2+i)}
          textAnchor="middle" fill={color}
          fontSize="10" fontWeight="600" fontFamily="system-ui,sans-serif">
          {label}
        </text>
      ))}
    </g>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  North Indian diamond chart: inner kites + outer triangles
// ══════════════════════════════════════════════════════════════════════════
//
//  The outer square has both diagonals drawn (the X).
//  A diamond T–R–B–L connects the midpoints of each side.
//  Together they create:
//    • 4 inner kite cells  (H1 top, H4 left, H7 bottom, H10 right)
//    • 8 outer triangles   (H2,H3 TL corner; H12,H11 TR; H5,H6 BL; H8,H9 BR)
//
//  Houses go counter-clockwise from H1 at top:
//    1→2→3→4→5→6→7→8→9→10→11→12
//
function DiamondChart({ chart }: { chart: ChartData }) {
  const SIZE = 420;
  const C  = SIZE / 2;          // 210 — center
  // midpoints of sides
  const T: Pt  = [C, 0];
  const R: Pt  = [SIZE, C];
  const B: Pt  = [C, SIZE];
  const L: Pt  = [0, C];
  // corner outer square
  const TL: Pt = [0, 0];
  const TR: Pt = [SIZE, 0];
  const BR: Pt = [SIZE, SIZE];
  const BL: Pt = [0, SIZE];
  // intersection of outer diagonals with inner diamond edges
  const q1: Pt = [C/2, C/2];           // 105, 105
  const q2: Pt = [SIZE-C/2, C/2];      // 315, 105
  const q3: Pt = [SIZE-C/2, SIZE-C/2]; // 315, 315
  const q4: Pt = [C/2, SIZE-C/2];      // 105, 315
  const MC: Pt = [C, C];               // center 210, 210

  const POLYS: Record<number, Pt[]> = {
    // inner kite cells
    1:  [T, q2, MC, q1],
    4:  [L, q1, MC, q4],
    7:  [B, q4, MC, q3],
    10: [R, q3, MC, q2],
    // outer corner triangles — TL corner (H2 top, H3 left)
    2:  [TL, T, q1],
    3:  [TL, q1, L],
    // TR corner (H12 top, H11 right)
    12: [TR, T, q2],
    11: [TR, q2, R],
    // BL corner (H5 left, H6 bottom)
    5:  [BL, L, q4],
    6:  [BL, q4, B],
    // BR corner (H9 right, H8 bottom)
    9:  [BR, R, q3],
    8:  [BR, q3, B],
  };

  const content = buildContent(chart);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%"
      style={{aspectRatio:'1/1'}} xmlns="http://www.w3.org/2000/svg">

      {Object.entries(POLYS).map(([hStr, poly]) => {
        const h = Number(hStr);
        const isLagna = h === 1;
        return <HouseCell key={h} house={h} poly={poly}
          sign={chart.houses[h-1]?.sign??''} items={content[h]}
          isLagna={isLagna} />;
      })}

      {/* Lagna sign label at center of H1 kite */}
      <text x={C} y={C/2 - 6} textAnchor="middle"
        fill="rgba(251,191,36,0.95)" fontSize="11" fontWeight="700"
        fontFamily="system-ui,sans-serif">
        {chart.lagna.sign}
      </text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  Main export
// ══════════════════════════════════════════════════════════════════════════
interface Props { chart: ChartData }

export default function LagnaChartSVG({ chart }: Props) {
  return <DiamondChart chart={chart} />;
}
