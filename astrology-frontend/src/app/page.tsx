import BirthDataForm from '@/components/BirthDataForm';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(251,191,36,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(99,102,241,0.2) 0%, transparent 50%)`,
        }}
      />
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Birth Chart
          </h1>
          <p className="mt-2 text-white/70">
            Enter your birth details to continue
          </p>
          <a
            href="/world-events"
            className="mt-4 inline-block text-sm text-violet-300/90 underline decoration-violet-400/40 underline-offset-4 hover:text-violet-200"
          >
            World events (AI)
          </a>
        </div>
        <BirthDataForm />
      </main>
    </div>
  );
}
