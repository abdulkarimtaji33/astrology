'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { isAxiosError } from 'axios';

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    router.replace(next);
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(next);
    } catch (e: unknown) {
      if (isAxiosError(e) && e.response?.data) {
        const d = e.response.data as { message?: string | string[] };
        const m = d.message;
        setErr(Array.isArray(m) ? m.join(', ') : m || 'Login failed');
      } else setErr('Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-card relative w-full max-w-md p-8">
      <div className="mb-8 text-center">
        <p className="mb-2 text-2xl text-amber-600 dark:text-amber-400/90">✦</p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-white/45">Sign in to view your charts and reminders</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200/90">
            {err}
          </div>
        )}
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-white/40"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="app-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-white/40"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="app-input"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-white/40">
        No account?{' '}
        <Link href="/register" className="font-medium text-amber-700 hover:text-amber-900 dark:text-amber-300/90 dark:hover:text-amber-200">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="app-shell flex items-center justify-center px-4 py-16">
      <div
        className="app-shell-glow"
        style={{
          backgroundImage: `radial-gradient(ellipse at 30% 20%, var(--glow-2) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, var(--glow-1) 0%, transparent 45%)`,
        }}
      />
      <Suspense
        fallback={
          <div className="relative h-48 w-full max-w-md animate-pulse rounded-2xl border border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-white/[0.04]" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
