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

type Birth = {
  id: number;
  name: string;
  birthDate: string;
  birthTime: string;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  createdAt: string;
};
type ListRes = { items: Birth[]; total: number; page: number; limit: number };

type DraftFilters = {
  q: string;
  cityQ: string;
  timezoneQ: string;
  dateFrom: string;
  dateTo: string;
  createdFrom: string;
  createdTo: string;
  idMin: string;
  idMax: string;
};

const emptyDraft: DraftFilters = {
  q: "",
  cityQ: "",
  timezoneQ: "",
  dateFrom: "",
  dateTo: "",
  createdFrom: "",
  createdTo: "",
  idMin: "",
  idMax: "",
};

function SkelRow({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 10 }).map((_, r) => (
        <tr key={r} className={adminTr}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-3 py-2.5">
              <div className="h-4 animate-pulse rounded bg-white/[0.05]" style={{ width: c === 0 ? 40 : 120 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function BirthRecordsAdmin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editing, setEditing] = useState<Birth | null>(null);
  const [form, setForm] = useState<Partial<Birth>>({});

  const [draft, setDraft] = useState<DraftFilters>(emptyDraft);
  const [applied, setApplied] = useState<DraftFilters>(emptyDraft);

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
      limit: 25,
      q: applied.q.trim() || undefined,
      cityQ: applied.cityQ.trim() || undefined,
      timezoneQ: applied.timezoneQ.trim() || undefined,
      dateFrom: applied.dateFrom || undefined,
      dateTo: applied.dateTo || undefined,
      createdFrom: applied.createdFrom || undefined,
      createdTo: applied.createdTo || undefined,
      idMin: applied.idMin.trim() ? Number(applied.idMin) : undefined,
      idMax: applied.idMax.trim() ? Number(applied.idMax) : undefined,
    }),
    [page, applied],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "birth-records", params],
    queryFn: () => adminApi.get<ListRes>("/admin/birth-records", { params }).then((r) => r.data),
  });

  const saveM = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name!,
        birthDate: String(form.birthDate).slice(0, 10),
        birthTime: form.birthTime!,
        cityName: form.cityName || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        timezone: form.timezone || undefined,
      };
      if (modal === "new") await adminApi.post("/admin/birth-records", payload);
      else if (editing) await adminApi.patch(`/admin/birth-records/${editing.id}`, payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "birth-records"] });
      setModal(null);
    },
  });

  const delM = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/birth-records/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "birth-records"] }),
  });

  const hasFilters = useMemo(
    () => Object.values(applied).some((v) => String(v).trim() !== ""),
    [applied],
  );

  function applyAll() {
    setPage(1);
    setApplied({ ...draft });
  }

  function clearAll() {
    setDraft(emptyDraft);
    setApplied(emptyDraft);
    setPage(1);
  }

  const chips: { key: keyof DraftFilters; label: string; tone: "cyan" | "amber" }[] = [
    { key: "q", label: "Search", tone: "cyan" },
    { key: "cityQ", label: "City", tone: "cyan" },
    { key: "timezoneQ", label: "TZ", tone: "cyan" },
    { key: "dateFrom", label: "Birth ≥", tone: "amber" },
    { key: "dateTo", label: "Birth ≤", tone: "amber" },
    { key: "createdFrom", label: "Created ≥", tone: "amber" },
    { key: "createdTo", label: "Created ≤", tone: "amber" },
    { key: "idMin", label: "ID ≥", tone: "cyan" },
    { key: "idMax", label: "ID ≤", tone: "cyan" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Birth records"
        subtitle="Charts and birth metadata. Combine filters to narrow large datasets; search matches name, city, or id."
        actions={
          <AdminBtnPrimary onClick={() => { setForm({}); setEditing(null); setModal("new"); }}>
            <IcoPlus />
            New record
          </AdminBtnPrimary>
        }
      />

      <AdminPanel>
        <AdminToolbar>
          <AdminFilterGrid>
            <AdminField label="Global search">
              <div className="relative">
                <IcoSearch />
                <input
                  className={cx(adminInput, "pl-9")}
                  placeholder="Name, city, or id…"
                  value={draft.q}
                  onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
                />
              </div>
            </AdminField>
            <AdminField label="City contains">
              <input
                className={adminInput}
                value={draft.cityQ}
                onChange={(e) => setDraft((d) => ({ ...d, cityQ: e.target.value }))}
                placeholder="Mumbai…"
              />
            </AdminField>
            <AdminField label="Timezone contains">
              <input
                className={adminInput}
                value={draft.timezoneQ}
                onChange={(e) => setDraft((d) => ({ ...d, timezoneQ: e.target.value }))}
                placeholder="Asia/…"
              />
            </AdminField>
            <AdminField label="Birth from">
              <input type="date" className={adminInput} value={draft.dateFrom} onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))} />
            </AdminField>
            <AdminField label="Birth to">
              <input type="date" className={adminInput} value={draft.dateTo} onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))} />
            </AdminField>
            <AdminField label="Created from">
              <input type="date" className={adminInput} value={draft.createdFrom} onChange={(e) => setDraft((d) => ({ ...d, createdFrom: e.target.value }))} />
            </AdminField>
            <AdminField label="Created to">
              <input type="date" className={adminInput} value={draft.createdTo} onChange={(e) => setDraft((d) => ({ ...d, createdTo: e.target.value }))} />
            </AdminField>
            <AdminField label="ID min">
              <input className={adminInput} inputMode="numeric" value={draft.idMin} onChange={(e) => setDraft((d) => ({ ...d, idMin: e.target.value }))} placeholder="1" />
            </AdminField>
            <AdminField label="ID max">
              <input className={adminInput} inputMode="numeric" value={draft.idMax} onChange={(e) => setDraft((d) => ({ ...d, idMax: e.target.value }))} placeholder="9999" />
            </AdminField>
          </AdminFilterGrid>
          <div className="flex flex-wrap gap-2">
            <AdminBtnPrimary type="button" onClick={applyAll}>
              Apply filters
            </AdminBtnPrimary>
            <AdminBtnGhost type="button" onClick={clearAll} disabled={!hasFilters && !draft.q}>
              Reset all
            </AdminBtnGhost>
          </div>
          {hasFilters ? (
            <div className="flex flex-wrap gap-2">
              {chips.map(({ key, label, tone }) =>
                applied[key] ? (
                  <AdminChip
                    key={key}
                    tone={tone}
                    onRemove={() => {
                      setDraft((d) => ({ ...d, [key]: "" }));
                      setApplied((a) => ({ ...a, [key]: "" }));
                      setPage(1);
                    }}
                  >
                    {label}: {applied[key]}
                  </AdminChip>
                ) : null,
              )}
            </div>
          ) : null}
        </AdminToolbar>

        <AdminTableScroll>
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr>
                <th className={adminTh}>ID</th>
                <th className={adminTh}>Name</th>
                <th className={adminTh}>Birth date</th>
                <th className={adminTh}>Time</th>
                <th className={adminTh}>City</th>
                <th className={adminTh}>Lat / Lng</th>
                <th className={adminTh}>Timezone</th>
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
                      title="No records match"
                      hint={
                        hasFilters ? (
                          <button type="button" onClick={clearAll} className="text-cyan-400 underline underline-offset-2">
                            Clear filters
                          </button>
                        ) : (
                          "Create a record to get started."
                        )
                      }
                    />
                  </td>
                </tr>
              )}
              {data?.items.map((r) => (
                <tr key={r.id} className={adminTr}>
                  <td className="px-3 py-2.5">
                    <span className="rounded-md bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300/90">{r.id}</span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-zinc-100">{r.name}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{String(r.birthDate).slice(0, 10)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-zinc-400">{r.birthTime}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{r.cityName ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-500">
                    {r.latitude != null && r.longitude != null ? `${r.latitude}, ${r.longitude}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-500">{r.timezone ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-zinc-600">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => {
                          setEditing(r);
                          setForm({ ...r, birthDate: String(r.birthDate).slice(0, 10) });
                          setModal("edit");
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-cyan-500/15 hover:text-cyan-300"
                      >
                        <IcoPencil />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => window.confirm("Delete this record?") && void delM.mutate(r.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-rose-500/15 hover:text-rose-300"
                      >
                        <IcoTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableScroll>

        {data ? (
          <div className="border-t border-white/[0.06] p-4">
            <PaginationBar page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
          </div>
        ) : null}
      </AdminPanel>

      <Modal open={modal != null} onClose={() => setModal(null)} title={modal === "new" ? "New birth record" : "Edit birth record"} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Name *">
            <input className={adminInput} value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          </AdminField>
          <AdminField label="Birth date *">
            <input type="date" className={adminInput} value={form.birthDate ? String(form.birthDate).slice(0, 10) : ""} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} />
          </AdminField>
          <AdminField label="Birth time *">
            <input className={adminInput} value={form.birthTime ?? ""} onChange={(e) => setForm((f) => ({ ...f, birthTime: e.target.value }))} placeholder="12:30:00" />
          </AdminField>
          <AdminField label="City">
            <input className={adminInput} value={form.cityName ?? ""} onChange={(e) => setForm((f) => ({ ...f, cityName: e.target.value }))} />
          </AdminField>
          <AdminField label="Latitude">
            <input type="number" step="any" className={adminInput} value={form.latitude != null ? String(form.latitude) : ""} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value ? +e.target.value : undefined }))} />
          </AdminField>
          <AdminField label="Longitude">
            <input type="number" step="any" className={adminInput} value={form.longitude != null ? String(form.longitude) : ""} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value ? +e.target.value : undefined }))} />
          </AdminField>
          <AdminField label="Timezone" className="sm:col-span-2">
            <input className={adminInput} value={form.timezone ?? ""} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} placeholder="Asia/Kolkata" />
          </AdminField>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <AdminBtnGhost onClick={() => setModal(null)}>Cancel</AdminBtnGhost>
          <AdminBtnPrimary disabled={saveM.isPending || !form.name || !form.birthDate || !form.birthTime} onClick={() => void saveM.mutate()}>
            {saveM.isPending ? "Saving…" : "Save"}
          </AdminBtnPrimary>
        </div>
      </Modal>
    </div>
  );
}
