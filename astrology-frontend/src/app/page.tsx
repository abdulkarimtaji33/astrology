import BirthDataForm from '@/components/BirthDataForm';
import RecentCharts from '@/components/RecentCharts';
import ZodiacWheel from '@/components/ZodiacWheel';

const FEATURES = [
  { icon: '☉', title: 'Precise Lagna chart', text: 'Lahiri ayanamsa, whole-sign houses, planetary dignities.' },
  { icon: '⟳', title: 'Transits & Dasha', text: 'Sade Sati, Mahadasha and live transit tracking.' },
  { icon: '✦', title: 'AI-powered reading', text: 'A plain-language analysis of your chart and the year ahead.' },
];

export default function Home() {
  return (
    <div className="app-shell">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-12">
        <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div className="fade-up text-center lg:text-left">
            <p className="eyebrow mb-3">Vedic astrology · Jyotish</p>
            <h1 className="text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              Read the sky <span className="gold-text">you were born under</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-white/60 sm:text-lg lg:mx-0">
              Enter your birth details to generate a Vedic birth chart in seconds — with transits, numerology and an AI
              interpretation.
            </p>
            <ul className="mx-auto mt-6 hidden max-w-xl gap-3 sm:grid lg:mx-0">
              {FEATURES.map(f => (
                <li key={f.title} className="flex items-start gap-3 text-left">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-lg text-amber-600 dark:text-amber-300">
                    {f.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{f.title}</span>
                    <span className="block text-sm text-slate-600 dark:text-white/55">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="fade-up-2 relative mx-auto w-full max-w-md">
            <ZodiacWheel className="pointer-events-none absolute -right-20 -top-28 -z-10 hidden h-80 w-80 text-amber-500/50 opacity-60 sm:block lg:-right-28 lg:-top-36 lg:h-[26rem] lg:w-[26rem] dark:text-amber-300/40" />
            <BirthDataForm />
          </div>
        </section>

        <section className="fade-up-3 mt-10 sm:mt-14">
          <RecentCharts />
        </section>
      </div>
    </div>
  );
}
