'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import ThemeToggle from '@/components/ThemeToggle';

export default function AppNav() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  const isHome = pathname === '/';
  const isWorldEvents = pathname === '/world-events';
  const isReminders = pathname === '/reminders';

  return (
    <header
      className="nav-border-glow sticky top-0 z-40 flex h-12 items-center justify-between gap-2 border-b px-3 backdrop-blur-md sm:gap-3 sm:px-6"
      style={{
        backgroundColor: 'var(--nav-bg)',
        borderColor: 'var(--app-border)',
      }}
    >
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 text-slate-800 transition hover:text-slate-950 dark:text-white/90 dark:hover:text-white"
      >
        <span className="text-amber-600 dark:text-amber-400 text-lg leading-none">✦</span>
        <span className="text-sm font-semibold tracking-wide">Jyotish</span>
      </Link>

      <nav
        className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto scrollbar-hide sm:gap-2"
        aria-label="Main"
      >
        <ThemeToggle />
        <Link
          href="/world-events"
          className={[
            'shrink-0 rounded-lg px-2.5 py-1.5 text-sm transition sm:px-3',
            isWorldEvents
              ? 'border border-violet-300/80 bg-violet-100/90 text-violet-900 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200'
              : 'text-violet-700 hover:bg-violet-100/70 dark:text-violet-300/80 dark:hover:bg-violet-500/10 dark:hover:text-violet-200',
          ].join(' ')}
        >
          World Events
        </Link>
        {user && (
          <Link
            href="/reminders"
            className={[
              'shrink-0 rounded-lg px-2.5 py-1.5 text-sm transition sm:px-3',
              isReminders
                ? 'border border-amber-400/60 bg-amber-100/90 text-amber-950 dark:border-amber-400/35 dark:bg-amber-400/15 dark:text-amber-200'
                : 'text-amber-800/90 hover:bg-amber-100/80 dark:text-amber-200/75 dark:hover:bg-amber-400/10 dark:hover:text-amber-200',
            ].join(' ')}
          >
            Reminders
          </Link>
        )}
        <Link
          href="/admin"
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition hover:text-amber-700 dark:text-slate-500 dark:hover:text-amber-200/80 sm:px-3"
        >
          Admin
        </Link>
        {!isHome && (
          <Link
            href="/"
            className="shrink-0 rounded-lg border px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-white/15 dark:text-white/60 dark:hover:border-white/25 dark:hover:bg-white/8 dark:hover:text-white/90 sm:px-3"
            style={{ borderColor: 'var(--app-border-strong)' }}
          >
            ← New Chart
          </Link>
        )}
        {loading ? (
          <span
            className="h-7 w-16 shrink-0 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10"
            aria-hidden
          />
        ) : user ? (
          <div
            className="flex shrink-0 items-center gap-1.5 border-l pl-2 sm:gap-2 dark:border-white/10"
            style={{ borderColor: 'var(--app-border)' }}
          >
            <span
              className="hidden max-w-[120px] truncate text-xs text-slate-500 dark:text-white/45 sm:inline md:max-w-[160px]"
              title={user.email}
            >
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white/85 sm:px-3"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div
            className="flex shrink-0 items-center gap-1 border-l pl-2 dark:border-white/10"
            style={{ borderColor: 'var(--app-border)' }}
          >
            <Link
              href="/login"
              className="rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white sm:px-3"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 dark:bg-amber-400/90 dark:text-slate-900 dark:hover:bg-amber-300 sm:px-3"
            >
              Register
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
