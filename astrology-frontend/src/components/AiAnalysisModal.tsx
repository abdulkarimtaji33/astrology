'use client';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface GemstoneAdvice {
  name: string;
  planet: string;
  reason: string;
}

export interface TransitMetric {
  percentage: number;
  explanation: string;
}

export interface InvestmentMetric {
  level: string;
  percentage: number;
  explanation: string;
}

export interface AiAnalysisResult {
  lifeGeneral: string;
  personality: string;
  wealth: string;
  familyLife: string;
  marriageLife: string;
  strongAreas: string[];
  weakAreas: string[];
  recommendedGemstones: GemstoneAdvice[];
  gemstonesToAvoid: GemstoneAdvice[];
  transitPeriod: string;
  transitOverview: string;
  dashaAnalysis?: string;
  investmentRisk: InvestmentMetric;
  jobOpportunity: TransitMetric;
  marriageLikelihood: TransitMetric;
  goodHealthLikelihood: TransitMetric;
}

// ─── Percentage ring ─────────────────────────────────────────────────────────
function PercentRing({
  pct,
  color,
  size = 80,
}: {
  pct: number;
  color: string;
  size?: number;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={size / 2} y={size / 2 + 5}
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="white"
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─── Investment level badge ────────────────────────────────────────────────
const LEVEL_STYLE: Record<string, string> = {
  'very risky': 'bg-red-500/20 text-red-300 border-red-500/30',
  'risky':      'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'neutral':    'bg-white/10 text-white/60 border-white/20',
  'good':       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'excellent':  'bg-amber-400/20 text-amber-300 border-amber-400/30',
};

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
      {children}
    </h3>
  );
}

// ─── Prose block ─────────────────────────────────────────────────────────────
function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split(/\n+/).filter(Boolean).map((para, i) => (
        <p key={i} className="text-sm leading-relaxed text-white/80">{para}</p>
      ))}
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({
  label,
  pct,
  color,
  ringColor,
  explanation,
}: {
  label: string;
  pct: number;
  color: string;
  ringColor: string;
  explanation: string;
}) {
  return (
    <div className={`rounded-2xl border ${color} p-4`}>
      <div className="flex items-center gap-4">
        <PercentRing pct={pct} color={ringColor} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{label}</p>
          <p className="mt-1 text-sm leading-snug text-white/70">{explanation}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main modal ──────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  isLoading: boolean;
  isError: boolean;
  data: AiAnalysisResult | null;
  transitPeriod: string;
  onClose: () => void;
}

export default function AiAnalysisModal({ isOpen, isLoading, isError, data, transitPeriod, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/90 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl my-6">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-white/10 bg-slate-900/95 backdrop-blur-md px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">AI Astrology Analysis</h2>
            <p className="text-xs text-white/40 mt-0.5">Transit period: {transitPeriod}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/50 transition hover:border-white/30 hover:text-white/90"
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-32 px-6">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
            <p className="text-sm text-white/50">Consulting the stars… this may take 15–30 seconds</p>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="p-6">
            <p className="rounded-xl bg-red-500/20 p-4 text-sm text-red-200">
              Failed to get AI analysis. Please check that the OpenAI API key is configured and try again.
            </p>
          </div>
        )}

        {/* Results */}
        {data && !isLoading && (
          <div className="flex flex-col gap-6 p-6">

            {/* ── Life Overview ── */}
            <div className="rounded-2xl border border-indigo-400/20 bg-indigo-400/5 p-5">
              <SectionTitle>Life Overview</SectionTitle>
              <Prose text={data.lifeGeneral} />
            </div>

            {/* ── Personality + Wealth ── */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <SectionTitle>Personality &amp; Character</SectionTitle>
                <Prose text={data.personality} />
              </div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                <SectionTitle>Wealth &amp; Finance</SectionTitle>
                <Prose text={data.wealth} />
              </div>
            </div>

            {/* ── Family + Marriage ── */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <SectionTitle>Family Life</SectionTitle>
                <Prose text={data.familyLife} />
              </div>
              <div className="rounded-2xl border border-pink-400/20 bg-pink-400/5 p-5">
                <SectionTitle>Marriage &amp; Relationships</SectionTitle>
                <Prose text={data.marriageLife} />
              </div>
            </div>

            {/* ── Strong & Weak Areas ── */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                <SectionTitle>Strong Areas</SectionTitle>
                <ul className="space-y-2">
                  {data.strongAreas?.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <span className="mt-0.5 shrink-0 text-emerald-400">✦</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
                <SectionTitle>Areas Needing Attention</SectionTitle>
                <ul className="space-y-2">
                  {data.weakAreas?.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <span className="mt-0.5 shrink-0 text-red-400">◈</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Gemstones ── */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Recommended */}
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5">
                <SectionTitle>Recommended Gemstones</SectionTitle>
                <div className="flex flex-col gap-3">
                  {data.recommendedGemstones?.map((g, i) => (
                    <div key={i} className="rounded-xl border border-amber-400/20 bg-amber-400/8 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-amber-300">{g.name}</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{g.planet}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{g.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avoid */}
              <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
                <SectionTitle>Gemstones to Avoid</SectionTitle>
                <div className="flex flex-col gap-3">
                  {data.gemstonesToAvoid?.map((g, i) => (
                    <div key={i} className="rounded-xl border border-red-400/20 bg-red-400/8 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-red-300">{g.name}</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{g.planet}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{g.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Transit Period divider ── */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold text-cyan-300">
                Transit Period: {data.transitPeriod}
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* ── Transit Overview ── */}
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
              <SectionTitle>Transit Overview</SectionTitle>
              <Prose text={data.transitOverview} />
            </div>

            {/* ── Dasha Analysis ── */}
            {data.dashaAnalysis && (
              <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-5">
                <SectionTitle>Vimshottari Dasha Analysis</SectionTitle>
                <Prose text={data.dashaAnalysis} />
              </div>
            )}

            {/* ── Metric Cards ── */}
            <div className="grid gap-4 sm:grid-cols-2">

              {/* Investment */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <SectionTitle>Investment Timing</SectionTitle>
                <div className="mb-3 flex items-center gap-3">
                  <PercentRing
                    pct={data.investmentRisk?.percentage ?? 0}
                    color={
                      (data.investmentRisk?.percentage ?? 0) >= 70 ? '#34d399'
                      : (data.investmentRisk?.percentage ?? 0) >= 40 ? '#fbbf24'
                      : '#f87171'
                    }
                  />
                  <div>
                    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold capitalize ${LEVEL_STYLE[data.investmentRisk?.level?.toLowerCase() ?? 'neutral'] ?? LEVEL_STYLE['neutral']}`}>
                      {data.investmentRisk?.level}
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/70">{data.investmentRisk?.explanation}</p>
              </div>

              {/* Job */}
              <MetricCard
                label="Job / Career Opportunity"
                pct={data.jobOpportunity?.percentage ?? 0}
                color="border-indigo-400/20 bg-indigo-400/5"
                ringColor="#818cf8"
                explanation={data.jobOpportunity?.explanation ?? ''}
              />

              {/* Marriage */}
              <MetricCard
                label="Marriage / Relationship Likelihood"
                pct={data.marriageLikelihood?.percentage ?? 0}
                color="border-pink-400/20 bg-pink-400/5"
                ringColor="#f472b6"
                explanation={data.marriageLikelihood?.explanation ?? ''}
              />

              {/* Health */}
              <MetricCard
                label="Good Health Likelihood"
                pct={data.goodHealthLikelihood?.percentage ?? 0}
                color="border-emerald-400/20 bg-emerald-400/5"
                ringColor="#34d399"
                explanation={data.goodHealthLikelihood?.explanation ?? ''}
              />

            </div>

            {/* Close button at bottom */}
            <div className="flex justify-center pt-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-white/15 px-8 py-2.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white/90"
              >
                Close
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
