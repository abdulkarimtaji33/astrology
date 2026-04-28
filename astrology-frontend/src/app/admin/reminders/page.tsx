"use client";

import {
  AdminBtnGhost,
  AdminBtnPrimary,
  AdminChip,
  AdminEmpty,
  AdminField,
  AdminFilterGrid,
  AdminPageHeader,
  AdminPanel,
  AdminTableScroll,
  AdminToolbar,
  adminInput,
  adminTh,
  adminTr,
  cx,
} from "@/components/admin/admin-ui";
import { Modal } from "@/components/admin/Modal";
import { PaginationBar } from "@/components/admin/PaginationBar";
import adminApi from "@/lib/adminApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";

function IcoPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M7 2v10M2 7h10" />
    </svg>
  );
}
function IcoPencil() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.5L2 9.5v2h2l7-7-2-2zM7 4.5l1.5 1.5" />
    </svg>
  );
}
function IcoTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5h9M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M4 3.5l.5 7h4l.5-7" />
    </svg>
  );
}
function IcoSearch() {
  return (
    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="6" cy="6" r="4.5" />
      <path d="M9.5 9.5l3 3" />
    </svg>
  );
}
function IcoBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500/90">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={cx("transition-transform", open && "rotate-180")}>
      <path d="M3.5 5.5L7 9l3.5-3.5" />
    </svg>
  );
}

type Reminder = {
  id: number;
  userId: number;
  ownerEmail: string | null;
  recipientEmail: string;
  sendDate: string;
  subject: string;
  placementDetails: string;
  note: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};
type ListRes = { items: Reminder[]; total: number; page: number; limit: number };

type Draft = {
  q: string;
  userId: string;
  status: string;
  sendFrom: string;
  sendTo: string;
  createdFrom: string;
  createdTo: string;
  idMin: string;
  idMax: string;
};

const emptyDraft: Draft = {
  q: "",
  userId: "",
  status: "",
  sendFrom: "",
  sendTo: "",
  createdFrom: "",
  createdTo: "",
  idMin: "",
  idMax: "",
};

const STATUSES = ["pending", "sent", "failed"] as const;

function statusPill(status: string) {
  const map: Record<string, string> = {
    pending:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200",
    sent: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-200",
    failed: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/35 dark:bg-rose-500/12 dark:text-rose-200",
  };
  return map[status] ?? map.pending;
}

function SkelRow({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, r) => (
        <tr key={r} className={adminTr}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-3 py-2.5">
              <div className="h-4 animate-pulse rounded bg-zinc-200/80 dark:bg-white/[0.06]" style={{ width: c === 0 ? 36 : 100 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function RemindersAdminPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [form, setForm] = useState<Partial<Reminder> & { userIdStr?: string }>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [applied, setApplied] = useState<Draft>(emptyDraft);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setApplied((a) => ({ ...a, q: draft.q }));
    }, 300);
    return () => clearTimeout(t);
  }, [draft.q]);
  const params = useMemo(
    () => ({
      page,
      limit: 20,
      q: applied.q.trim() || undefined,
      userId: applied.userId.trim() ? Number(applied.userId) : undefined,
      status: applied.status.trim() || undefined,
      sendDateFrom: applied.sendFrom || undefined,
      sendDateTo: applied.sendTo || undefined,
      createdFrom: applied.createdFrom || undefined,
      createdTo: applied.createdTo || undefined,
      idMin: applied.idMin.trim() ? Number(applied.idMin) : undefined,
      idMax: applied.idMax.trim() ? Number(applied.idMax) : undefined,
    }),
    [page, applied],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reminders", params],
    queryFn: () => adminApi.get<ListRes>("/admin/reminders", { params }).then((r) => r.data),
  });

  const saveM = useMutation({
    mutationFn: async () => {
      const uid = Number(form.userIdStr ?? form.userId);
      if (modal === "new") {
        await adminApi.post("/admin/reminders", {
          userId: uid,
          recipientEmail: form.recipientEmail!,
          sendDate: String(form.sendDate).slice(0, 10),
          subject: form.subject!,
          placementDetails: form.placementDetails!,
          note: form.note || undefined,
          status: form.status || "pending",
        });
      } else if (editing) {
        await adminApi.patch(`/admin/reminders/${editing.id}`, {
          userId: uid || undefined,
          recipientEmail: form.recipientEmail,
          sendDate: form.sendDate ? String(form.sendDate).slice(0, 10) : undefined,
          subject: form.subject,
          placementDetails: form.placementDetails,
          note: form.note === "" ? "" : form.note,
          status: form.status,
        });
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "reminders"] });
      setModal(null);
      setEditing(null);
    },
  });

  const delM = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/reminders/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "reminders"] }),
  });

  const hasFilters = useMemo(() => Object.values(applied).some((v) => String(v).trim() !== ""), [applied]);

  const pendingApprox = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((i) => i.status === "pending").length;
  }, [data?.items]);

  function applyAll() {
    setPage(1);
    setApplied({ ...draft });
  }
  function clearAll() {
    setDraft(emptyDraft);
    setApplied(emptyDraft);
    setPage(1);
  }

  function openNew() {
    setForm({
      userIdStr: "",
      recipientEmail: "",
      sendDate: new Date().toISOString().slice(0, 10),
      subject: "",
      placementDetails: "",
      note: "",
      status: "pending",
    });
    setEditing(null);
    setModal("new");
  }
  function openEdit(r: Reminder) {
    setEditing(r);
    setForm({
      ...r,
      userIdStr: String(r.userId),
      sendDate: r.sendDate,
    });
    setModal("edit");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Transit reminders"
        subtitle="Email reminders users schedule from transit views. Filter by status, owner, or send date. Expand a row for full placement text."
        actions={
          <AdminBtnPrimary onClick={openNew}>
            <IcoPlus />
            New reminder
          </AdminBtnPrimary>
        }
      />

      {/* Highlight strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50 to-white p-4 shadow-sm dark:border-cyan-500/20 dark:from-cyan-500/[0.08] dark:to-zinc-900/90 dark:shadow-none">
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400/90">
            <IcoBell />
            <span className="text-[10px] font-semibold uppercase tracking-widest">This page</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">{data?.total ?? "—"}</p>
          <p className="mt-0.5 text-xs text-zinc-500"> reminders match filters</p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-4 shadow-sm dark:border-amber-500/20 dark:from-amber-500/[0.07] dark:to-zinc-900/90">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-800/80 dark:text-amber-400/80">Pending (sample)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">{isLoading ? "…" : pendingApprox}</p>
          <p className="mt-0.5 text-xs text-zinc-500">on current page</p>
        </div>
        <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/80 to-white p-4 shadow-sm dark:border-violet-500/20 dark:from-violet-500/[0.07] dark:to-zinc-900/90">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-800/80 dark:text-violet-400/80">Tip</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Re-open <span className="font-medium text-zinc-800 dark:text-zinc-300">failed</span> items by setting status back to{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-300">pending</span> after fixing SMTP or copy.
          </p>
        </div>
      </div>

      <AdminPanel>
        <AdminToolbar>
          <div className="flex flex-wrap gap-2 pb-1">
            {(["", "pending", "sent", "failed"] as const).map((st) => (
              <button
                key={st || "all"}
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, status: st }));
                  setApplied((a) => ({ ...a, status: st }));
                  setPage(1);
                }}
                className={cx(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  (draft.status || "") === st
                    ? "border-cyan-400 bg-cyan-500 text-white shadow-md shadow-cyan-900/15 dark:border-cyan-400 dark:bg-cyan-400 dark:text-zinc-950"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400",
                )}
              >
                {st === "" ? "All" : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
          <AdminFilterGrid>
            <AdminField label="Search">
              <div className="relative">
                <IcoSearch />
                <input
                  className={cx(adminInput, "pl-9")}
                  placeholder="Subject, email, placement, id…"
                  value={draft.q}
                  onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
                />
              </div>
            </AdminField>
            <AdminField label="User id">
              <input
                className={adminInput}
                inputMode="numeric"
                placeholder="2"
                value={draft.userId}
                onChange={(e) => setDraft((d) => ({ ...d, userId: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Send from">
              <input type="date" className={adminInput} value={draft.sendFrom} onChange={(e) => setDraft((d) => ({ ...d, sendFrom: e.target.value }))} />
            </AdminField>
            <AdminField label="Send to">
              <input type="date" className={adminInput} value={draft.sendTo} onChange={(e) => setDraft((d) => ({ ...d, sendTo: e.target.value }))} />
            </AdminField>
            <AdminField label="Created from">
              <input type="date" className={adminInput} value={draft.createdFrom} onChange={(e) => setDraft((d) => ({ ...d, createdFrom: e.target.value }))} />
            </AdminField>
            <AdminField label="Created to">
              <input type="date" className={adminInput} value={draft.createdTo} onChange={(e) => setDraft((d) => ({ ...d, createdTo: e.target.value }))} />
            </AdminField>
            <AdminField label="ID min">
              <input className={adminInput} inputMode="numeric" value={draft.idMin} onChange={(e) => setDraft((d) => ({ ...d, idMin: e.target.value }))} />
            </AdminField>
            <AdminField label="ID max">
              <input className={adminInput} inputMode="numeric" value={draft.idMax} onChange={(e) => setDraft((d) => ({ ...d, idMax: e.target.value }))} />
            </AdminField>
          </AdminFilterGrid>
          <div className="flex flex-wrap gap-2">
            <AdminBtnPrimary type="button" onClick={applyAll}>
              Apply filters
            </AdminBtnPrimary>
            <AdminBtnGhost type="button" onClick={clearAll} disabled={!hasFilters}>
              Reset all
            </AdminBtnGhost>
          </div>
          {hasFilters ? (
            <div className="flex flex-wrap gap-2">
              {(["q", "userId", "status", "sendFrom", "sendTo", "createdFrom", "createdTo", "idMin", "idMax"] as const).map((key) =>
                applied[key] ? (
                  <AdminChip
                    key={key}
                    tone="cyan"
                    onRemove={() => {
                      setDraft((d) => ({ ...d, [key]: "" }));
                      setApplied((a) => ({ ...a, [key]: "" }));
                      setPage(1);
                    }}
                  >
                    {key}: {applied[key]}
                  </AdminChip>
                ) : null,
              )}
            </div>
          ) : null}
        </AdminToolbar>

        <AdminTableScroll>
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr>
                <th className={cx(adminTh, "w-8")} />
                <th className={adminTh}>ID</th>
                <th className={adminTh}>Status</th>
                <th className={adminTh}>Send date</th>
                <th className={adminTh}>Owner</th>
                <th className={adminTh}>Recipient</th>
                <th className={adminTh}>Subject</th>
                <th className={adminTh}>Created</th>
                <th className={cx(adminTh, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <SkelRow cols={9} />}
              {!isLoading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <AdminEmpty
                      title="No reminders"
                      hint={
                        hasFilters ? (
                          <button type="button" onClick={clearAll} className="text-cyan-400 underline underline-offset-2">
                            Clear filters
                          </button>
                        ) : (
                          "Create one or wait for users to schedule from transits."
                        )
                      }
                    />
                  </td>
                </tr>
              )}
              {data?.items.map((r) => (
                <Fragment key={r.id}>
                  <tr className={cx(adminTr, expanded === r.id && "bg-cyan-50/50 dark:bg-cyan-500/[0.04]")}>
                    <td className="px-1 py-2 text-center">
                      <button
                        type="button"
                        className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-white/10 dark:hover:text-white"
                        aria-expanded={expanded === r.id}
                        onClick={() => setExpanded((e) => (e === r.id ? null : r.id))}
                      >
                        <IcoChevron open={expanded === r.id} />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-zinc-500 dark:text-zinc-400">{r.id}</td>
                    <td className="px-3 py-2.5">
                      <span className={cx("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize", statusPill(r.status))}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-medium text-zinc-800 dark:text-zinc-200">{r.sendDate}</td>
                    <td className="max-w-[140px] px-3 py-2.5">
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400" title={r.ownerEmail ?? ""}>
                        {r.ownerEmail ?? `user #${r.userId}`}
                      </span>
                      <span className="tabular-nums text-[11px] text-zinc-400">#{r.userId}</span>
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 text-zinc-700 dark:text-zinc-300" title={r.recipientEmail}>
                      {r.recipientEmail}
                    </td>
                    <td className="max-w-[220px] px-3 py-2.5">
                      <span className="line-clamp-2 text-zinc-800 dark:text-zinc-200">{r.subject}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-zinc-500">
                      {new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5"
                          onClick={() => openEdit(r)}
                          aria-label="Edit"
                        >
                          <IcoPencil />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-rose-200/80 p-2 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
                          onClick={() => {
                            if (confirm(`Delete reminder #${r.id}?`)) delM.mutate(r.id);
                          }}
                          aria-label="Delete"
                        >
                          <IcoTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === r.id ? (
                    <tr className="border-b border-zinc-100 bg-zinc-50/90 dark:border-white/[0.06] dark:bg-zinc-900/60">
                      <td colSpan={9} className="px-5 py-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-500/80">Placement</p>
                            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-200/80 bg-white p-3 text-xs leading-relaxed text-zinc-700 dark:border-white/10 dark:bg-zinc-950/80 dark:text-zinc-300">
                              {r.placementDetails}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-500/80">Note</p>
                            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{r.note || "—"}</p>
                            <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Updated</p>
                            <p className="mt-1 text-xs text-zinc-500">{new Date(r.updatedAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </AdminTableScroll>

        {data && data.total > data.limit ? (
          <div className="border-t border-zinc-200 p-4 dark:border-white/[0.06]">
            <PaginationBar page={page} total={data.total} limit={data.limit} onPage={setPage} />
          </div>
        ) : null}
      </AdminPanel>

      <Modal
        open={modal != null}
        wide
        title={modal === "new" ? "New reminder" : `Edit reminder #${editing?.id}`}
        onClose={() => { setModal(null); setEditing(null); }}
      >
        <div className="grid max-h-[min(80vh,640px)] gap-4 overflow-y-auto p-1 sm:grid-cols-2">
          <AdminField label="User ID (owner)">
            <input
              className={adminInput}
              inputMode="numeric"
              required
              value={form.userIdStr ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, userIdStr: e.target.value }))}
            />
          </AdminField>
          <AdminField label="Recipient email">
            <input
              type="email"
              className={adminInput}
              required
              value={form.recipientEmail ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
            />
          </AdminField>
          <AdminField label="Send date">
            <input
              type="date"
              className={adminInput}
              required
              value={form.sendDate ? String(form.sendDate).slice(0, 10) : ""}
              onChange={(e) => setForm((f) => ({ ...f, sendDate: e.target.value }))}
            />
          </AdminField>
          <AdminField label="Status">
            <select
              className={adminInput}
              value={form.status ?? "pending"}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </AdminField>
          <div className="sm:col-span-2">
            <AdminField label="Subject">
              <input
                className={adminInput}
                required
                maxLength={500}
                value={form.subject ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </AdminField>
          </div>
          <div className="sm:col-span-2">
            <AdminField label="Placement details">
              <textarea
                className={cx(adminInput, "min-h-[140px] resize-y font-mono text-xs")}
                required
                value={form.placementDetails ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, placementDetails: e.target.value }))}
              />
            </AdminField>
          </div>
          <div className="sm:col-span-2">
            <AdminField label="Note (optional)">
              <textarea
                className={cx(adminInput, "min-h-[72px] resize-y")}
                value={form.note ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </AdminField>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-white/[0.08]">
          <AdminBtnGhost onClick={() => { setModal(null); setEditing(null); }}>Cancel</AdminBtnGhost>
          <AdminBtnPrimary
            disabled={saveM.isPending}
            onClick={() => {
              const uid = Number(form.userIdStr);
              if (!uid || !form.recipientEmail || !form.sendDate || !form.subject || !form.placementDetails) return;
              saveM.mutate();
            }}
          >
            {saveM.isPending ? "Saving…" : "Save"}
          </AdminBtnPrimary>
        </div>
      </Modal>
    </div>
  );
}
