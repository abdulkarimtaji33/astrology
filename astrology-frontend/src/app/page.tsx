import BirthDataForm from '@/components/BirthDataForm';
import RecentCharts from '@/components/RecentCharts';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-3rem)] overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(ellipse at 20% 60%, rgba(99,102,241,0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 20%, rgba(251,191,36,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 85%, rgba(139,92,246,0.12) 0%, transparent 50%)`,
        }}
      />
      <main className="relative mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">

          {/* Left: Recent Charts (only shown when there are entries) */}
          <div className="lg:w-80 lg:shrink-0">
            <RecentCharts />
          </div>

          {/* Right: Form — centered on mobile, left-aligned on desktop */}
          <div className="flex flex-1 flex-col items-center lg:items-start">
            <div className="mb-6 text-center lg:text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Vedic Birth Chart
              </h1>
              <p className="mt-1.5 text-sm text-white/55">
                Enter birth details to generate a Lagna chart with AI analysis.
              </p>
            </div>
            <BirthDataForm />
          </div>

        </div>
      </main>
    </div>
  );
}
