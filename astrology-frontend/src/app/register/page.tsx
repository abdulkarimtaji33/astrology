'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { isAxiosError } from 'axios';
import {
  AuthCard,
  AuthShell,
  ErrorBanner,
  FieldLabel,
  PasswordField,
  PasswordStrength,
} from '@/components/auth-ui';

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
      } else setErr('Registration failed. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard title="Create your account" subtitle="Save charts privately and get transit reminders by email">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {err && <ErrorBanner>{err}</ErrorBanner>}
          <div>
            <FieldLabel htmlFor="reg-email">Email</FieldLabel>
            <input
              id="reg-email"
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
            <FieldLabel htmlFor="reg-password">Password</FieldLabel>
            <PasswordField
              id="reg-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
            />
            <PasswordStrength value={password} />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary btn-block mt-1 min-h-12">
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-white/50">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-amber-700 hover:underline dark:text-amber-300">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
