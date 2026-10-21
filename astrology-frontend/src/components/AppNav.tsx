'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import ThemeToggle from '@/components/ThemeToggle';
import { SIGNUP_ENABLED } from '@/lib/features';

type Item = { href: string; label: string; icon: ReactNode; match: (p: string) => boolean; authOnly?: boolean };

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const IcoHome = (
  <svg viewBox="0 0 24 24" width="22" height="22" {...stroke}>
    <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z" />
  </svg>
);
const IcoGlobe = (
  <svg viewBox="0 0 24 24" width="22" height="22" {...stroke}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
  </svg>
);
const IcoHash = (
  <svg viewBox="0 0 24 24" width="22" height="22" {...stroke}>
    <path d="M5 9h14M4 15h14M10 3L8 21M16 3l-2 18" />
  </svg>
);
const IcoBell = (
  <svg viewBox="0 0 24 24" width="22" height="22" {...stroke}>
    <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0" />
  </svg>
);
const IcoMore = (
  <svg viewBox="0 0 24 24" width="22" height="22" {...stroke}>
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="19" cy="12" r="1.2" />
  </svg>
);
const IcoUser = (
  <svg viewBox="0 0 24 24" width="22" height="22" {...stroke}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const ITEMS: Item[] = [
  { href: '/', label: 'Chart', icon: IcoHome, match: p => p === '/' || p.startsWith('/chart') },
  { href: '/world-events', label: 'World', icon: IcoGlobe, match: p => p.startsWith('/world-events') },
  { href: '/name-numerology', label: 'Numerology', icon: IcoHash, match: p => p.startsWith('/name-numerology') },
  { href: '/reminders', label: 'Reminders', icon: IcoBell, match: p => p.startsWith('/reminders'), authOnly: true },
];

export default function AppNav() {
  const pathname = usePathname() ?? '/';
  const { user, loading, logout } = useAuth();
  const [sheet, setSheet] = useState(false);
  const isAdmin = pathname.startsWith('/admin');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.classList.toggle('is-admin', isAdmin);
    return () => document.body.classList.remove('is-admin');
  }, [isAdmin]);

  useEffect(() => setSheet(false), [pathname]);

  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheet]);

  if (isAdmin) return null;

  const items = ITEMS.filter(i => !i.authOnly || user);
  const initial = user?.email?.[0]?.toUpperCase() ?? '';

  return (
    <>
      {/* Top bar */}
      <header
        className="nav-border-glow sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur-xl sm:px-6"
        style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--app-border)' }}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Jyotish home">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-600 text-base text-slate-900 shadow-md shadow-amber-500/30">
            ✦
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Jyotish</span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {items.map(i => {
            const active = i.match(pathname);
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'rounded-xl px-3.5 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
                    : 'text-slate-600 hover:bg-slate-500/10 hover:text-slate-900 dark:text-white/60 dark:hover:text-white',
                ].join(' ')}
              >
                {i.label === 'Chart' ? 'New chart' : i.label === 'World' ? 'World events' : i.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {loading ? (
            <span className="skeleton h-9 w-20" aria-hidden />
          ) : user ? (
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="flex h-9 items-center gap-2 rounded-full border bg-white/60 py-1 pl-1 pr-3 text-sm font-medium transition hover:border-amber-400/60 dark:bg-white/5"
              style={{ borderColor: 'var(--app-border-strong)' }}
              aria-label="Account menu"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-xs font-bold text-slate-900">
                {initial}
              </span>
              <span className="hidden max-w-[140px] truncate text-xs sm:inline">{user.email}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login" className={SIGNUP_ENABLED ? 'btn btn-ghost btn-sm hidden sm:inline-flex' : 'btn btn-primary btn-sm'}>
                Sign in
              </Link>
              {SIGNUP_ENABLED && (
                <Link href="/register" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Bottom tab bar (phones) */}
      <nav className="bottom-nav md:hidden" aria-label="Primary">
        <ul className="mx-auto flex h-16 max-w-xl items-stretch justify-around px-1">
          {items.map(i => {
            const active = i.match(pathname);
            return (
              <li key={i.href} className="flex-1">
                <Link
                  href={i.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition',
                    active ? 'text-amber-600 dark:text-amber-300' : 'text-slate-500 dark:text-white/50',
                  ].join(' ')}
                >
                  {active && (
                    <span className="absolute top-0 h-0.5 w-8 rounded-full bg-gradient-to-r from-amber-300 to-amber-600" />
                  )}
                  {i.icon}
                  {i.label}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-500 dark:text-white/50"
            >
              {user ? IcoUser : IcoMore}
              {user ? 'Account' : 'More'}
            </button>
          </li>
        </ul>
      </nav>

      {/* Account / More sheet */}
      {sheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:justify-end sm:p-4 sm:pt-16"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSheet(false)}
          />
          <div className="app-card relative w-full max-w-sm !bg-white dark:!bg-slate-900 !rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:!rounded-2xl" style={{ animation: 'sheet-up .28s cubic-bezier(.2,.8,.2,1) both' }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-400/40 sm:hidden" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">{user ? 'Signed in' : 'Welcome'}</p>
                <p className="truncate font-display text-lg font-semibold">{user ? user.email : 'Explore Jyotish'}</p>
              </div>
              <button ref={closeRef} type="button" onClick={() => setSheet(false)} className="btn btn-ghost btn-sm" aria-label="Close">
                ✕
              </button>
            </div>
            <ul className="flex flex-col gap-1">
              {user && (
                <MenuLink href="/reminders" label="Reminders" hint="Transit email alerts" />
              )}
              {user && <MenuLink href="/account" label="Account & security" hint="Password, sessions" />}
              <MenuLink href="/world-events" label="World events" hint="Planetary events & transits" />
              <MenuLink href="/name-numerology" label="Name numerology" hint="Check any name" />
              {user?.isAdmin && <MenuLink href="/admin" label="Admin console" hint="Manage records & data" />}
            </ul>
            <div className="mt-4 flex gap-2">
              {user ? (
                <button type="button" onClick={() => { setSheet(false); void logout(); }} className="btn btn-secondary btn-block">
                  Sign out
                </button>
              ) : (
                <>
                  <Link href="/login" className="btn btn-primary flex-1">Sign in</Link>
                  {SIGNUP_ENABLED && <Link href="/register" className="btn btn-secondary flex-1">Create account</Link>}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuLink({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-14 items-center justify-between gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-500/10"
      >
        <span>
          <span className="block text-sm font-semibold">{label}</span>
          <span className="block text-xs text-slate-500 dark:text-white/45">{hint}</span>
        </span>
        <span aria-hidden className="text-slate-400">›</span>
      </Link>
    </li>
  );
}
