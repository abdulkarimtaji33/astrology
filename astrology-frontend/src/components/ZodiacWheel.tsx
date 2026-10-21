const SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map(g => g + '︎');

/** Decorative rotating zodiac wheel used in the hero. Pure SVG, no assets. */
export default function ZodiacWheel({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-110 -110 220 220" className={className} aria-hidden>
      <defs>
        <radialGradient id="zw-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="orbit" style={{ transformBox: 'fill-box' }}>
        <circle r="104" fill="none" stroke="currentColor" strokeOpacity="0.25" />
        <circle r="74" fill="none" stroke="currentColor" strokeOpacity="0.2" />
        {SIGNS.map((s, i) => {
          const a = (i * 30 - 90) * (Math.PI / 180);
          const a2 = ((i * 30) - 90 + 15) * (Math.PI / 180);
          return (
            <g key={s}>
              <line
                x1={Math.cos(a) * 74}
                y1={Math.sin(a) * 74}
                x2={Math.cos(a) * 104}
                y2={Math.sin(a) * 104}
                stroke="currentColor"
                strokeOpacity="0.25"
              />
              <text
                x={Math.cos(a2) * 89}
                y={Math.sin(a2) * 89}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="14"
                fill="currentColor"
                fillOpacity="0.85"
              >
                {s}
              </text>
            </g>
          );
        })}
      </g>
      <rect x="-40" y="-40" width="80" height="80" fill="none" stroke="#f59e0b" strokeOpacity="0.7" transform="rotate(45)" />
      <path d="M-40 0L0 -40L40 0L0 40Z M-20 -20L20 20 M20 -20L-20 20" fill="none" stroke="#f59e0b" strokeOpacity="0.35" />
      <circle r="26" fill="url(#zw-core)" />
      <text textAnchor="middle" dominantBaseline="central" fontSize="22" fill="#fbbf24">☉</text>
    </svg>
  );
}
