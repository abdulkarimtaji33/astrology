'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { isAxiosError } from 'axios';
import { AuthCard, AuthShell, ErrorBanner, FieldLabel, PasswordField } from '@/components/auth-ui';
import { SIGNUP_ENABLED } from '@/lib/features';

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only same-site paths: never let ?next= bounce the user to another website.
  const rawNext = searchParams.get('next') || '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  if (!loading && user) return null;

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
      } else setErr('Login failed. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to open your charts and reminders">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {err && <ErrorBanner>{err}</ErrorBanner>}
        <div>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="app-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-slate-700 dark:text-white/80">Password</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-300">Forgot password?</Link>
          </div>
          <PasswordField id="login-password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        <button type="submit" disabled={submitting} className="btn btn-primary btn-block mt-1 min-h-12">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {SIGNUP_ENABLED && (
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-white/50">
          New here?{' '}
          <Link href="/register" className="font-semibold text-amber-700 hover:underline dark:text-amber-300">
            Create a free account
          </Link>
        </p>
      )}
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="skeleton h-96 w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
