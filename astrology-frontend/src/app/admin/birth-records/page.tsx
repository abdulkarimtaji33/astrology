"use client";

import { Modal } from "@/components/admin/Modal";
import { PaginationBar } from "@/components/admin/PaginationBar";
import adminApi from "@/lib/adminApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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

export default function BirthRecordsAdmin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editing, setEditing] = useState<Birth | null>(null);
  const [form, setForm] = useState<Partial<Birth>>({});

  const limit = 20;
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "birth-records", page],
    queryFn: () => adminApi.get<ListRes>("/admin/birth-records", { params: { page, limit } }).then((r) => r.data),
  });

  const saveM = useMutation({
    mutationFn: async () => {
      if (modal === "new") {
        const body = {
          name: form.name!,
          birthDate: (form.birthDate as string).slice(0, 10),
          birthTime: form.birthTime!,
          cityName: form.cityName || undefined,
          latitude: form.latitude ?? undefined,
          longitude: form.longitude ?? undefined,
          timezone: form.timezone || undefined,
        };
        await adminApi.post("/admin/birth-records", body);
      } else if (editing) {
        await adminApi.patch(`/admin/birth-records/${editing.id}`, {
          name: form.name,
          birthDate: form.birthDate ? String(form.birthDate).slice(0, 10) : undefined,
          birthTime: form.birthTime,
          cityName: form.cityName,
          latitude: form.latitude,
          longitude: form.longitude,
          timezone: form.timezone,
        });
      }
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

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-amber-50">Birth records</h1>
          <p className="text-sm text-slate-500">Stored charts and birth data.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({});
            setEditing(null);
            setModal("new");
          }}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
        >
          + New
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-3">Id</th>
              <th className="p-3">Name</th>
              <th className="p-3">Date</th>
              <th className="p-3">Time</th>
              <th className="p-3">City</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-6 text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {data?.items.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3 font-mono text-xs text-amber-200/80">{r.id}</td>
                <td className="p-3 font-medium text-slate-200">{r.name}</td>
                <td className="p-3 text-slate-400">{String(r.birthDate).slice(0, 10)}</td>
                <td className="p-3 text-slate-400">{r.birthTime}</td>
                <td className="p-3 text-slate-500">{r.cityName || "—"}</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    className="mr-2 text-amber-400/90 hover:underline"
                    onClick={() => {
                      setEditing(r);
                      setForm({ ...r, birthDate: String(r.birthDate).slice(0, 10) });
                      setModal("edit");
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-rose-400/80 hover:underline"
                    onClick={() => {
                      if (window.confirm("Delete this record?")) void delM.mutate(r.id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <div className="mt-4"><PaginationBar page={data.page} total={data.total} limit={data.limit} onPage={setPage} /></div>}

      <Modal
        open={modal != null}
        onClose={() => setModal(null)}
        title={modal === "new" ? "New birth record" : "Edit birth record"}
        wide
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-500">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
              value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="text-xs text-slate-500">
            Birth date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
              value={form.birthDate ? String(form.birthDate).slice(0, 10) : ""}
              onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
            />
          </label>
          <label className="text-xs text-slate-500">
            Time
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
              value={form.birthTime ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, birthTime: e.target.value }))}
              placeholder="12:30:00"
            />
          </label>
          <label className="text-xs text-slate-500">
            City name
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
              value={form.cityName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, cityName: e.target.value }))}
            />
          </label>
          <label className="text-xs text-slate-500">
            Latitude
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
              value={form.latitude != null ? String(form.latitude) : ""}
              onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value ? +e.target.value : undefined }))}
            />
          </label>
          <label className="text-xs text-slate-500">
            Longitude
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
              value={form.longitude != null ? String(form.longitude) : ""}
              onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value ? +e.target.value : undefined }))}
            />
          </label>
          <label className="col-span-full text-xs text-slate-500">
            Timezone
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
              value={form.timezone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-lg px-3 py-1.5 text-sm text-slate-400" onClick={() => setModal(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-slate-950 disabled:opacity-50"
            disabled={saveM.isPending || !form.name || !form.birthDate || !form.birthTime}
            onClick={() => void saveM.mutate()}
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}
