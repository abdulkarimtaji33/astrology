'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

type ReminderRow = {
  id: number;
  recipientEmail: string;
  sendDate: string;
  subject: string;
  placementDetails: string;
  note: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function formatReminderDate(iso: string): string {
  const s = iso.slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusStyle(status: string): string {
  if (status === 'sent') {
    return 'border-emerald-300/90 bg-emerald-50 text-emerald-900 dark:border-emerald-400/35 dark:bg-emerald-500/10 dark:text-emerald-200/90';
  }
  if (status === 'failed') {
    return 'border-red-300/90 bg-red-50 text-red-900 dark:border-red-400/35 dark:bg-red-500/10 dark:text-red-200/90';
  }
  return 'border-amber-300/90 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200/85';
}

export default function RemindersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    recipientEmail: '',
    sendDate: '',
    subject: '',
    note: '',
  });
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent('/reminders')}`);
  }, [authLoading, user, router]);

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => api.get<ReminderRow[]>('/reminders').then(r => r.data),
    enabled: !!user,
  });

  const sorted = useMemo(() => {
    if (!reminders) return [];
    return [...reminders].sort((a, b) => a.sendDate.localeCompare(b.sendDate) || b.id - a.id);
  }, [reminders]);

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['reminders'] });
  }, [qc]);

  const patchMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Record<string, unknown> }) => {
      await api.patch(`/reminders/${id}`, body);
    },
    onSuccess: () => {
      invalidate();
      setEditId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reminders/${id}`);
    },
    onSuccess: invalidate,
  });

  const testMutation = useMutation({
    mutationFn: () => api.post<{ ok: boolean; message?: string }>('/reminders/test-email').then(r => r.data),
    onSuccess: d => {
      setTestMsg({ ok: true, text: d.message ?? 'Test email sent.' });
    },
    onError: (e: unknown) => {
      if (isAxiosError(e) && e.response?.data) {
        const msg = (e.response.data as { message?: string }).message;
        setTestMsg({ ok: false, text: msg || 'Could not send test email.' });
        return;
      }
      setTestMsg({ ok: false, text: 'Could not send test email.' });
    },
  });

  const startEdit = (r: ReminderRow) => {
    setEditId(r.id);
    setEditForm({
      recipientEmail: r.recipientEmail,
      sendDate: r.sendDate.slice(0, 10),
      subject: r.subject,
      note: r.note ?? '',
    });
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId == null) return;
    patchMutation.mutate({
      id: editId,
      body: {
        recipientEmail: editForm.recipientEmail.trim(),
        sendDate: editForm.sendDate,
        subject: editForm.subject.trim(),
        note: editForm.note.trim() || null,
      },
    });
  };

  if (authLoading || !user) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent dark:border-amber-400" />
      </div>
    );
  }

  return (
    <div className="app-shell overflow-hidden">
      <div
        className="app-shell-glow"
        style={{
          backgroundImage: `radial-gradient(ellipse at 25% 30%, var(--glow-2) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 70%, var(--glow-1) 0%, transparent 48%)`,
        }}
      />
      <main className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400/80">✦ Transit reminders</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Your reminders
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-white/50">
              Emails are sent on the scheduled date (server cron). Default recipient is your account email; you can override
              per reminder. Use test send to verify SMTP from the server.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setTestMsg(null);
                testMutation.mutate();
              }}
              disabled={testMutation.isPending}
              className="rounded-xl border border-cyan-300/80 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900 shadow-sm transition hover:bg-cyan-100 disabled:opacity-50 dark:border-cyan-400/40 dark:bg-cyan-500/15 dark:text-cyan-200 dark:hover:bg-cyan-500/25"
            >
              {testMutation.isPending ? 'Sending…' : 'Send test email'}
            </button>
            <Link
              href="/"
              className="rounded-xl border border-slate-300/90 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
            >
              New chart
            </Link>
          </div>
        </div>

        {testMsg && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              testMsg.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100/90'
                : 'border-red-200 bg-red-50 text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100/90'
            }`}
          >
            {testMsg.text}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-white/[0.04]"
              />
            ))}
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div className="rounded-2xl border border-slate-200/90 bg-white/85 px-8 py-14 text-center shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-slate-700 dark:text-white/70">No reminders yet.</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/40">
              Open a chart → Transit tab → click a house → schedule a reminder on a transit range.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              Go to charts
            </Link>
          </div>
        )}

        {!isLoading && sorted.length > 0 && (
          <ul className="flex flex-col gap-3">
            {sorted.map(r => (
              <li
                key={r.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 shadow-md backdrop-blur-md dark:border-white/[0.12] dark:from-white/[0.07] dark:to-white/[0.03] dark:shadow-lg"
              >
                {editId === r.id ? (
                  <form onSubmit={saveEdit} className="flex flex-col gap-4 p-5 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-white/40">
                          Recipient
                        </label>
                        <input
                          type="email"
                          required
                          value={editForm.recipientEmail}
                          onChange={e => setEditForm(f => ({ ...f, recipientEmail: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300/90 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-400/25 dark:border-white/15 dark:bg-slate-900/50 dark:text-white dark:focus:border-amber-400/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-white/40">
                          Send on
                        </label>
                        <input
                          type="date"
                          required
                          value={editForm.sendDate}
                          onChange={e => setEditForm(f => ({ ...f, sendDate: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300/90 bg-white px-3 py-2 text-sm text-slate-900 [color-scheme:light] focus:border-amber-500 focus:outline-none dark:border-white/15 dark:bg-slate-900/50 dark:text-white dark:[color-scheme:dark] dark:focus:border-amber-400/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-white/40">
                        Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.subject}
                        onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))}
                        className="w-full rounded-xl border border-slate-300/90 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none dark:border-white/15 dark:bg-slate-900/50 dark:text-white dark:focus:border-amber-400/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-white/40">
                        Note
                      </label>
                      <textarea
                        value={editForm.note}
                        onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-slate-300/90 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none dark:border-white/15 dark:bg-slate-900/50 dark:text-white dark:focus:border-amber-400/50"
                      />
                    </div>
                    {patchMutation.isError && (
                      <p className="text-sm text-red-700 dark:text-red-300/90">Could not save. Check fields and try again.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={patchMutation.isPending}
                        className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
                      >
                        {patchMutation.isPending ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditId(null)}
                        className="rounded-xl border border-slate-300/90 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusStyle(r.status)}`}
                          >
                            {r.status}
                          </span>
                          <span className="text-xs tabular-nums text-indigo-700 dark:text-indigo-300/80">
                            {formatReminderDate(r.sendDate)}
                          </span>
                        </div>
                        <h2 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white/90">
                          {r.subject}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-white/40">
                          To <span className="text-slate-700 dark:text-white/60">{r.recipientEmail}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                          className="rounded-lg border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/12 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white/90"
                        >
                          {expandedId === r.id ? 'Hide details' : 'Details'}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          className="rounded-lg border border-amber-400/50 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/20"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this reminder?')) deleteMutation.mutate(r.id);
                          }}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg border border-red-300/80 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-400/25 dark:text-red-300/90 dark:hover:bg-red-500/15"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {expandedId === r.id && (
                      <div className="border-t border-slate-200/80 bg-slate-50/80 px-5 py-4 dark:border-white/8 dark:bg-black/20 sm:px-6">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/30">Placement</p>
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-600 dark:text-white/50">
                          {r.placementDetails}
                        </pre>
                        {r.note && (
                          <>
                            <p className="mt-4 text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/30">
                              Your note
                            </p>
                            <p className="mt-1 text-sm text-slate-700 dark:text-white/55">{r.note}</p>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
