'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { isAxiosError } from 'axios';

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    router.replace('/');
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (password.length < 8) {
      setErr('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password);
      router.replace('/');
    } catch (e: unknown) {
      if (isAxiosError(e) && e.response?.data) {
        const d = e.response.data as { message?: string | string[] };
        const m = d.message;
        setErr(Array.isArray(m) ? m.join(', ') : m || 'Registration failed');
      } else setErr('Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell flex items-center justify-center px-4 py-16">
      <div
        className="app-shell-glow"
        style={{
          backgroundImage: `radial-gradient(ellipse at 70% 30%, var(--glow-3) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 70%, var(--glow-2) 0%, transparent 45%)`,
        }}
      />
      <div className="app-card relative w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <p className="mb-2 text-2xl text-amber-600 dark:text-amber-400/90">✦</p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Create account</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/45">
            Save charts privately and manage email reminders
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200/90">
              {err}
            </div>
          )}
          <div>
            <label
              htmlFor="reg-email"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-white/40"
            >
              Email
            </label>
            <input
              id="reg-email"
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
              htmlFor="reg-password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-white/40"
            >
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="app-input"
              placeholder="At least 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-white/40">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-amber-700 hover:text-amber-900 dark:text-amber-300/90 dark:hover:text-amber-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
