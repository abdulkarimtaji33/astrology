import BirthDataForm from '@/components/BirthDataForm';
import RecentCharts from '@/components/RecentCharts';

export default function Home() {
  return (
    <div className="app-shell">
      <div
        className="app-shell-glow"
        style={{
          backgroundImage: `radial-gradient(ellipse at 20% 60%, var(--glow-1) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 20%, var(--glow-2) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 85%, var(--glow-3) 0%, transparent 50%)`,
        }}
      />
      <main className="relative mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
          <div className="lg:w-80 lg:shrink-0">
            <RecentCharts />
          </div>

          <div className="flex flex-1 flex-col items-center lg:items-start">
            <div className="mb-6 text-center lg:text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Vedic Birth Chart
              </h1>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-white/55">
                Sign in to save private charts, then enter birth details for a Lagna chart and AI analysis.
              </p>
            </div>
            <BirthDataForm />
          </div>
        </div>
      </main>
    </div>
  );
}
