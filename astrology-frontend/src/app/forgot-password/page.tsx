'use client';

import Link from 'next/link';
import { useState } from 'react';
import { isAxiosError } from 'axios';
import { authHttp } from '@/lib/auth-session';
import { AuthCard, AuthShell, ErrorBanner, FieldLabel } from '@/components/auth-ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      await authHttp.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (e: unknown) {
      if (isAxiosError(e) && e.response?.status === 429) {
        setErr('Too many requests. Please wait a minute and try again.');
      } else {
        setErr('Could not send the reset link. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard title="Reset your password" subtitle="We'll email you a link to choose a new one">
        {sent ? (
          <div className="flex flex-col gap-5 text-center">
            <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-800 dark:text-emerald-200">
              If an account exists for <strong>{email}</strong>, a reset link is on its way. It is valid for 30
              minutes.
            </p>
            <Link href="/login" className="btn btn-secondary btn-block">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {err && <ErrorBanner>{err}</ErrorBanner>}
            <div>
              <FieldLabel htmlFor="fp-email">Email</FieldLabel>
              <input
                id="fp-email"
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
            <button type="submit" disabled={submitting} className="btn btn-primary btn-block min-h-12">
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <Link href="/login" className="text-center text-sm font-semibold text-amber-700 hover:underline dark:text-amber-300">
              Back to sign in
            </Link>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
}
