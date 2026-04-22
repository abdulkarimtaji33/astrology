'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppNav() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  const isHome = pathname === '/';
  const isWorldEvents = pathname === '/world-events';

  return (
    <header className="nav-border-glow sticky top-0 z-40 flex h-12 items-center justify-between border-b border-white/10 bg-slate-950/85 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 text-white/90 transition hover:text-white"
      >
        <span className="text-amber-400 text-lg leading-none">✦</span>
        <span className="text-sm font-semibold tracking-wide">Jyotish</span>
      </Link>

      {/* Right: Nav links */}
      <nav className="flex items-center gap-2">
        <Link
          href="/world-events"
          className={[
            'rounded-lg px-3 py-1.5 text-sm transition',
            isWorldEvents
              ? 'text-violet-200 bg-violet-500/15 border border-violet-400/30'
              : 'text-violet-300/80 hover:text-violet-200 hover:bg-violet-500/10',
          ].join(' ')}
        >
          World Events
        </Link>
        <Link
          href="/admin"
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:text-amber-200/80"
        >
          Admin
        </Link>
        {!isHome && (
          <Link
            href="/"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/60 transition hover:border-white/25 hover:bg-white/8 hover:text-white/90"
          >
            ← New Chart
          </Link>
        )}
      </nav>
    </header>
  );
}
