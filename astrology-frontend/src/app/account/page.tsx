'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import api from '@/lib/api';
import { logoutEverywhereRequest } from '@/lib/auth-session';
import { useAuth } from '@/contexts/auth-context';
import { ErrorBanner, FieldLabel, PasswordField, PasswordStrength } from '@/components/auth-ui';

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/account');
  }, [loading, user, router]);

  if (loading || !user) return <div className="app-shell"><div className="mx-auto mt-10 w-full max-w-xl px-4"><div className="skeleton h-64" /></div></div>;

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setOk(false);
    setBusy(true);
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      setOk(true);
      setCurrent('');
      setNext('');
    } catch (e: unknown) {
      if (isAxiosError(e) && e.response?.data) {
        const m = (e.response.data as { message?: string | string[] }).message;
        setErr(Array.isArray(m) ? m.join(', ') : m || 'Could not change password');
      } else setErr('Could not change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-6 sm:pt-12">
        <p className="eyebrow mb-1">Account</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Security</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-white/55">
          Signed in as <strong>{user.email}</strong>. You stay signed in on this device until you sign out.
        </p>

        <form onSubmit={change} className="app-card mt-6 flex flex-col gap-5 p-6" style={{ border: '1px solid var(--app-border)' }}>
          <h2 className="text-xl font-semibold">Change password</h2>
          {err && <ErrorBanner>{err}</ErrorBanner>}
          {ok && (
            <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
              Password changed. Your other devices were signed out.
            </p>
          )}
          <div>
            <FieldLabel htmlFor="cp-current">Current password</FieldLabel>
            <PasswordField id="cp-current" value={current} onChange={setCurrent} autoComplete="current-password" />
          </div>
          <div>
            <FieldLabel htmlFor="cp-new">New password</FieldLabel>
            <PasswordField id="cp-new" value={next} onChange={setNext} autoComplete="new-password" minLength={8} />
            <PasswordStrength value={next} />
          </div>
          <button type="submit" disabled={busy} className="btn btn-primary min-h-12">
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>

        <div className="app-card mt-4 flex flex-col gap-3 p-6" style={{ border: '1px solid var(--app-border)' }}>
          <h2 className="text-xl font-semibold">Sessions</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => void logout().then(() => router.replace('/'))}>
              Sign out
            </button>
            <button
              type="button"
              className="btn btn-secondary flex-1 !text-red-600 dark:!text-red-300"
              onClick={() => void logoutEverywhereRequest().then(() => router.replace('/login'))}
            >
              Sign out of all devices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
