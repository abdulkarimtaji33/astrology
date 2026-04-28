'use client';

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

// ─── Public minimal shape ──────────────────────────────────────────────────
/** Minimal chart shape needed to render the diamond chart SVG. */
export interface ChartShape {
  lagna: { sign: string };
  houses: { sign: string }[];
  planets: {
    planet: string;
    house: number;
    degreeInSign: number;
    isRetrograde: boolean;
    dignity: string[];
  }[];
}

function buildContent(chart: ChartShape) {
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
  const totalLines = 1 + items.length;
  const startY = cy - ((totalLines - 1) * lineH) / 2 - 6;

  return (
    <g>
      <polygon
        points={pts(poly)}
        fill={isLagna ? 'var(--chart-fill-lagna)' : 'var(--chart-cell)'}
        stroke={isLagna ? 'var(--chart-stroke-lagna)' : 'var(--chart-stroke)'}
        strokeWidth="0.8"
      />
      <text x={cx} y={startY}
        textAnchor="middle" fill="var(--chart-text-dim)"
        fontSize="8.5" fontFamily="system-ui,sans-serif">
        {house}
      </text>
      <text x={cx} y={startY + lineH}
        textAnchor="middle" fill="var(--chart-text-sign)"
        fontSize="10" fontWeight="500" fontFamily="system-ui,sans-serif">
        {SIGN_ABBR[sign] ?? sign}
      </text>
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
//  North Indian diamond chart
// ══════════════════════════════════════════════════════════════════════════
export function DiamondChart({ chart }: { chart: ChartShape }) {
  const SIZE = 420;
  const C  = SIZE / 2;
  const T: Pt  = [C, 0];
  const R: Pt  = [SIZE, C];
  const B: Pt  = [C, SIZE];
  const L: Pt  = [0, C];
  const TL: Pt = [0, 0];
  const TR: Pt = [SIZE, 0];
  const BR: Pt = [SIZE, SIZE];
  const BL: Pt = [0, SIZE];
  const q1: Pt = [C/2, C/2];
  const q2: Pt = [SIZE-C/2, C/2];
  const q3: Pt = [SIZE-C/2, SIZE-C/2];
  const q4: Pt = [C/2, SIZE-C/2];
  const MC: Pt = [C, C];

  const POLYS: Record<number, Pt[]> = {
    1:  [T, q2, MC, q1],
    4:  [L, q1, MC, q4],
    7:  [B, q4, MC, q3],
    10: [R, q3, MC, q2],
    2:  [TL, T, q1],
    3:  [TL, q1, L],
    12: [TR, T, q2],
    11: [TR, q2, R],
    5:  [BL, L, q4],
    6:  [BL, q4, B],
    9:  [BR, R, q3],
    8:  [BR, q3, B],
  };

  const content = buildContent(chart);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%"
      style={{aspectRatio:'1/1'}} xmlns="http://www.w3.org/2000/svg">
      {Object.entries(POLYS).map(([hStr, poly]) => {
        const h = Number(hStr);
        return <HouseCell key={h} house={h} poly={poly}
          sign={chart.houses[h-1]?.sign??''} items={content[h]}
          isLagna={h === 1} />;
      })}
      <text x={C} y={C/2 - 6} textAnchor="middle"
        fill="var(--chart-lagna-label)" fontSize="11" fontWeight="700"
        fontFamily="system-ui,sans-serif">
        {chart.lagna.sign}
      </text>
    </svg>
  );
}

// ─── Default export ────────────────────────────────────────────────────────
export default function LagnaChartSVG({ chart }: { chart: ChartShape }) {
  return <DiamondChart chart={chart} />;
}
