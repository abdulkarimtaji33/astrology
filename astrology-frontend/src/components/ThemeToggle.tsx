'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span
        className="h-8 w-8 shrink-0 rounded-lg border border-slate-200/80 bg-slate-100/80 dark:border-white/10 dark:bg-white/5"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === 'dark';
  const cycle = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
      return;
    }
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const label =
    theme === 'system'
      ? `Theme: system (${isDark ? 'dark' : 'light'}). Click to switch.`
      : `Theme: ${theme}. Click to cycle light / dark / system.`;

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white/90 text-lg shadow-sm transition hover:border-amber-400/40 hover:bg-amber-50 dark:border-white/12 dark:bg-white/5 dark:shadow-none dark:hover:bg-white/10"
    >
      <span className="leading-none" aria-hidden>
        {theme === 'system' ? '◐' : isDark ? '☀' : '☾'}
      </span>
    </button>
  );
}
