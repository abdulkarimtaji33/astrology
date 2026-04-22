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
import { useEffect, useMemo, useState } from "react";

function IcoEye() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M1 6.5s2.5-4 5.5-4 5.5 4 5.5 4-2.5 4-5.5 4S1 6.5 1 6.5" />
      <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
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
function IcoCopy() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <path d="M1 8V2a1 1 0 0 1 1-1h6" />
    </svg>
  );
}

type Row = {
  id: number;
  birthRecordId: number;
  transitFrom: string;
  transitTo: string;
  basis: string;
  model: string;
  prompt: string;
  response: string;
  createdAt: string;
};
type ListRes = { items: Row[]; total: number; page: number; limit: number };
type BrLookup = { items: { id: number; name: string }[]; total: number; page: number; limit: number };

type Draft = {
  q: string;
  model: string;
  basis: string;
  birthRecordId: string;
  transitFrom: string;
  transitTo: string;
  createdFrom: string;
  createdTo: string;
  idMin: string;
  idMax: string;
};

const empty: Draft = {
  q: "",
  model: "",
  basis: "",
  birthRecordId: "",
  transitFrom: "",
  transitTo: "",
  createdFrom: "",
  createdTo: "",
  idMin: "",
  idMax: "",
};

function Skel({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 10 }).map((_, r) => (
        <tr key={r} className={adminTr}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-3 py-2.5">
              <div className="h-4 animate-pulse rounded bg-white/[0.05]" style={{ width: 80 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AiAnalysesAdmin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<Row | null>(null);
  const [copied, setCopied] = useState<"prompt" | "response" | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [applied, setApplied] = useState<Draft>(empty);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setApplied((a) => ({ ...a, q: draft.q }));
    }, 350);
    return () => clearTimeout(t);
  }, [draft.q]);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      q: applied.q.trim() || undefined,
      model: applied.model.trim() || undefined,
      basis: applied.basis.trim() || undefined,
      birthRecordId: applied.birthRecordId.trim() ? Number(applied.birthRecordId) : undefined,
      transitFrom: applied.transitFrom || undefined,
      transitTo: applied.transitTo || undefined,
      createdFrom: applied.createdFrom || undefined,
      createdTo: applied.createdTo || undefined,
      idMin: applied.idMin.trim() ? Number(applied.idMin) : undefined,
      idMax: applied.idMax.trim() ? Number(applied.idMax) : undefined,
    }),
    [page, applied],
  );

  const q = useQuery({
    queryKey: ["admin", "ai", params],
    queryFn: () => adminApi.get<ListRes>("/admin/ai-analyses", { params }).then((r) => r.data),
  });

  const birthLookup = useQuery({
    queryKey: ["admin", "birth-records", "lookup"],
    queryFn: () => adminApi.get<BrLookup>("/admin/birth-records", { params: { page: 1, limit: 2000 } }).then((r) => r.data),
    staleTime: 60_000,
  });

  const delM = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/ai-analyses/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "ai"] }),
  });

  const nameById = (id: number) => birthLookup.data?.items.find((b) => b.id === id)?.name;

  const hasFilters = useMemo(() => Object.values(applied).some((v) => String(v).trim() !== ""), [applied]);

  function applyAll() {
    setPage(1);
    setApplied({ ...draft });
  }

  function clearAll() {
    setDraft(empty);
    setApplied(empty);
    setPage(1);
  }

  async function copy(text: string, field: "prompt" | "response") {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  }

  const basisOptions = useMemo(() => {
    const s = new Set<string>();
    q.data?.items.forEach((r) => r.basis && s.add(r.basis));
    return Array.from(s).sort();
  }, [q.data]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI analyses"
        subtitle="Search across chart names, prompts, responses, models, and ids. Narrow by transit window, basis, or creation date."
        actions={
          q.data ? (
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/80 px-4 py-2 text-right">
              <p className="font-mono text-xl font-bold text-white">{q.data.total.toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">matching rows</p>
            </div>
          ) : null
        }
      />

      <AdminPanel>
        <AdminToolbar>
          <AdminFilterGrid>
            <AdminField label="Global search">
              <input
                className={adminInput}
                placeholder="Chart, prompt, response, model, id…"
                value={draft.q}
                onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Model contains">
              <input className={adminInput} value={draft.model} onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))} placeholder="gpt-4…" />
            </AdminField>
            <AdminField label="Basis">
              <input className={adminInput} list="basis-list" value={draft.basis} onChange={(e) => setDraft((d) => ({ ...d, basis: e.target.value }))} placeholder="Exact match" />
              <datalist id="basis-list">
                {basisOptions.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </AdminField>
            <AdminField label="Birth record id">
              <input className={adminInput} inputMode="numeric" value={draft.birthRecordId} onChange={(e) => setDraft((d) => ({ ...d, birthRecordId: e.target.value }))} />
            </AdminField>
            <AdminField label="Transit from ≥">
              <input type="date" className={adminInput} value={draft.transitFrom} onChange={(e) => setDraft((d) => ({ ...d, transitFrom: e.target.value }))} />
            </AdminField>
            <AdminField label="Transit to ≤">
              <input type="date" className={adminInput} value={draft.transitTo} onChange={(e) => setDraft((d) => ({ ...d, transitTo: e.target.value }))} />
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
            <AdminBtnGhost type="button" onClick={clearAll}>
              Reset all
            </AdminBtnGhost>
          </div>
          {hasFilters ? (
            <div className="flex flex-wrap gap-2">
              {(Object.keys(applied) as (keyof Draft)[]).map((k) =>
                applied[k] ? (
                  <AdminChip
                    key={k}
                    tone="cyan"
                    onRemove={() => {
                      setDraft((d) => ({ ...d, [k]: "" }));
                      setApplied((a) => ({ ...a, [k]: "" }));
                      setPage(1);
                    }}
                  >
                    {k}: {applied[k]}
                  </AdminChip>
                ) : null,
              )}
            </div>
          ) : null}
        </AdminToolbar>

        <AdminTableScroll>
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr>
                <th className={adminTh}>ID</th>
                <th className={adminTh}>Chart</th>
                <th className={adminTh}>Model</th>
                <th className={adminTh}>Transit</th>
                <th className={adminTh}>Basis</th>
                <th className={adminTh}>Created</th>
                <th className={cx(adminTh, "text-right")}> </th>
              </tr>
            </thead>
            <tbody>
              {!q.data && <Skel cols={7} />}
              {q.data?.items.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <AdminEmpty
                      title="No analyses"
                      hint={
                        hasFilters ? (
                          <button type="button" onClick={clearAll} className="text-cyan-400 underline underline-offset-2">
                            Clear filters
                          </button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              )}
              {q.data?.items.map((r) => (
                <tr key={r.id} className={adminTr}>
                  <td className="px-3 py-2.5">
                    <span className="rounded-md bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300/90">{r.id}</span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-200">{nameById(r.birthRecordId) ?? `#${r.birthRecordId}`}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-block max-w-[140px] truncate rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 font-mono text-[11px] text-violet-200">
                      {r.model}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-500">
                    {r.transitFrom ? `${String(r.transitFrom).slice(0, 10)} → ${String(r.transitTo).slice(0, 10)}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-zinc-500">{r.basis || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-zinc-600">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button type="button" title="View" onClick={() => setView(r)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-cyan-500/15 hover:text-cyan-300">
                        <IcoEye />
                      </button>
                      <button type="button" title="Delete" onClick={() => window.confirm("Delete?") && void delM.mutate(r.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-rose-500/15 hover:text-rose-300">
                        <IcoTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableScroll>

        {q.data ? (
          <div className="border-t border-white/[0.06] p-4">
            <PaginationBar page={q.data.page} total={q.data.total} limit={q.data.limit} onPage={setPage} />
          </div>
        ) : null}
      </AdminPanel>

      <Modal open={view != null} onClose={() => setView(null)} title={view ? `Analysis #${view.id}` : ""} wide>
        {view && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 font-mono text-xs text-violet-200">{view.model}</span>
              {view.basis ? <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400">{view.basis}</span> : null}
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-500">{new Date(view.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Prompt</span>
                <button type="button" onClick={() => void copy(view.prompt, "prompt")} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
                  <IcoCopy /> {copied === "prompt" ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-zinc-950 p-4 text-xs text-zinc-300">{view.prompt}</pre>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Response</span>
                <button type="button" onClick={() => void copy(view.response, "response")} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
                  <IcoCopy /> {copied === "response" ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-zinc-950 p-4 text-xs text-zinc-200">{view.response}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
