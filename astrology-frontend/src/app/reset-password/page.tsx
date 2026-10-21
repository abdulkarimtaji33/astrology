'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { isAxiosError } from 'axios';
import { authHttp } from '@/lib/auth-session';
import { AuthCard, AuthShell, ErrorBanner, FieldLabel, PasswordField, PasswordStrength } from '@/components/auth-ui';

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <AuthCard title="Link not valid" subtitle="This password reset link is missing its token">
        <Link href="/forgot-password" className="btn btn-primary btn-block">
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      await authHttp.post('/auth/reset-password', { token, newPassword: password });
      setDone(true);
      setTimeout(() => router.replace('/login'), 2500);
    } catch (e: unknown) {
      if (isAxiosError(e) && e.response?.data) {
        const m = (e.response.data as { message?: string | string[] }).message;
        setErr(Array.isArray(m) ? m.join(', ') : m || 'Could not reset password');
      } else setErr('Could not reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Choose a new password" subtitle="You'll be signed out everywhere and asked to sign in again">
      {done ? (
        <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-center text-sm text-emerald-800 dark:text-emerald-200">
          Password updated. Taking you to sign in…
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {err && <ErrorBanner>{err}</ErrorBanner>}
          <div>
            <FieldLabel htmlFor="rp-password">New password</FieldLabel>
            <PasswordField
              id="rp-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
            />
            <PasswordStrength value={password} />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary btn-block min-h-12">
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="skeleton h-80 w-full" />}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
