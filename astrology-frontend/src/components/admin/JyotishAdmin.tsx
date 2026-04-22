"use client";

import { Modal } from "@/components/admin/Modal";
import adminApi from "@/lib/adminApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const TABS = [
  { key: "planets", label: "Planets" },
  { key: "houses", label: "Houses" },
  { key: "zodiac", label: "Zodiac" },
  { key: "avastha", label: "Avastha" },
  { key: "rel", label: "Planet rel." },
  { key: "phi", label: "PHI" },
  { key: "drishti", label: "Drishti" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function JyotishAdmin() {
  const [tab, setTab] = useState<TabKey>("planets");
  return (
    <div>
      <h1 className="text-xl font-semibold text-amber-50">Jyotish reference data</h1>
      <p className="mt-1 text-sm text-slate-500">Planets, houses, zodiac, avasthā, relations, and drishti rules.</p>
      <div className="mt-4 flex flex-wrap gap-1 border-b border-white/10 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              "rounded-t-lg px-3 py-2 text-sm transition",
              tab === t.key ? "bg-amber-500/15 text-amber-100" : "text-slate-500 hover:text-slate-300",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tab === "planets" && <PlanetsBlock />}
        {tab === "houses" && <HousesBlock />}
        {tab === "zodiac" && <ZodiacBlock />}
        {tab === "avastha" && <AvasthaBlock />}
        {tab === "rel" && <RelBlock />}
        {tab === "phi" && <PhiBlock />}
        {tab === "drishti" && <DrishtiBlock />}
      </div>
    </div>
  );
}

function PlanetsBlock() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "planets"],
    queryFn: () => adminApi.get("/admin/planets").then((r) => r.data as Record<string, unknown>[]),
  });
  const m = useMutation({
    mutationFn: (row: { id: number; name: string; sanskritName: string; type: string }) =>
      adminApi.put("/admin/planets", row),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "planets"] });
      setOpen(false);
    },
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/planets/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "planets"] }),
  });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ id: "", name: "", sanskritName: "", type: "" });

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setF({ id: "", name: "", sanskritName: "", type: "planet" });
          setOpen(true);
        }}
        className="mb-3 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-slate-950"
      >
        + Add
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">#</th>
              <th className="p-2">Name</th>
              <th className="p-2">Sanskrit</th>
              <th className="p-2">Type</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((r) => (
              <tr key={String(r.id)} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2">{String(r.name ?? "")}</td>
                <td className="p-2">{String((r as { sanskritName?: string }).sanskritName ?? "")}</td>
                <td className="p-2 text-slate-500">{String(r.type ?? "")}</td>
                <td className="p-2 text-right text-xs">
                  <button
                    type="button"
                    className="text-amber-400/90"
                    onClick={() => {
                      setF({
                        id: String(r.id),
                        name: String(r.name ?? ""),
                        sanskritName: String((r as { sanskritName?: string }).sanskritName ?? ""),
                        type: String(r.type ?? ""),
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-rose-400/80"
                    onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}
                  >
                    Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Planet">
        <div className="space-y-2">
          {[
            ["id", f.id, (v: string) => setF((x) => ({ ...x, id: v }))],
            ["name", f.name, (v: string) => setF((x) => ({ ...x, name: v }))],
            ["sanskritName", f.sanskritName, (v: string) => setF((x) => ({ ...x, sanskritName: v }))],
            ["type", f.type, (v: string) => setF((x) => ({ ...x, type: v }))],
          ].map(([k, v, on]) => (
            <label key={String(k)} className="block text-xs text-slate-500">
              {k as string}
              <input
                className="mt-0.5 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-sm"
                value={v as string}
                onChange={(e) => (on as (v: string) => void)(e.target.value)}
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="text-sm text-slate-500" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-slate-950"
            onClick={() =>
              m.mutate({
                id: +f.id,
                name: f.name,
                sanskritName: f.sanskritName,
                type: f.type,
              })
            }
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

function HousesBlock() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "houses"],
    queryFn: () => adminApi.get("/admin/houses").then((r) => r.data as Record<string, unknown>[]),
  });
  const m = useMutation({
    mutationFn: (row: { id: number; name: string; mainTheme: string; represents: string }) =>
      adminApi.put("/admin/houses", row),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "houses"] });
      setOpen(false);
    },
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/houses/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "houses"] }),
  });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ id: "", name: "", mainTheme: "", represents: "" });

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setF({ id: "", name: "", mainTheme: "", represents: "" });
          setOpen(true);
        }}
        className="mb-3 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-slate-950"
      >
        + Add
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">#</th>
              <th className="p-2">Name</th>
              <th className="p-2">Theme</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((r) => (
              <tr key={String(r.id)} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2">{String(r.name)}</td>
                <td className="p-2 text-slate-400">{String((r as { mainTheme?: string }).mainTheme)}</td>
                <td className="p-2 text-right text-xs">
                  <button
                    type="button"
                    className="text-amber-400/90"
                    onClick={() => {
                      setF({
                        id: String(r.id),
                        name: String(r.name),
                        mainTheme: String((r as { mainTheme?: string }).mainTheme),
                        represents: String((r as { represents?: string }).represents ?? ""),
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-rose-400/80"
                    onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}
                  >
                    Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="House" wide>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["id", f.id, (v: string) => setF((x) => ({ ...x, id: v }))],
              ["name", f.name, (v: string) => setF((x) => ({ ...x, name: v }))],
            ] as const
          ).map(([k, v, on]) => (
            <label key={k} className="text-xs text-slate-500">
              {k}
              <input
                className="mt-0.5 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-sm"
                value={v}
                onChange={(e) => on(e.target.value)}
              />
            </label>
          ))}
          <label className="col-span-full text-xs text-slate-500">
            mainTheme
            <input
              className="mt-0.5 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-sm"
              value={f.mainTheme}
              onChange={(e) => setF((x) => ({ ...x, mainTheme: e.target.value }))}
            />
          </label>
          <label className="col-span-full text-xs text-slate-500">
            represents
            <textarea
              className="mt-0.5 min-h-[80px] w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-sm"
              value={f.represents}
              onChange={(e) => setF((x) => ({ ...x, represents: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="text-sm text-slate-500" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-slate-950"
            onClick={() =>
              m.mutate({
                id: +f.id,
                name: f.name,
                mainTheme: f.mainTheme,
                represents: f.represents,
              })
            }
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ZodiacBlock() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "zodiac"],
    queryFn: () => adminApi.get("/admin/zodiac-signs").then((r) => r.data as Record<string, unknown>[]),
  });
  const m = useMutation({
    mutationFn: (row: { id: number; name: string; element: string; modality: string; ruledBy: number | null }) =>
      adminApi.put("/admin/zodiac-signs", row),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "zodiac"] });
      setOpen(false);
    },
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/zodiac-signs/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "zodiac"] }),
  });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ id: "", name: "", element: "", modality: "", ruledBy: "" });

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setF({ id: "", name: "", element: "", modality: "", ruledBy: "" });
          setOpen(true);
        }}
        className="mb-3 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-slate-950"
      >
        + Add
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">#</th>
              <th className="p-2">Sign</th>
              <th className="p-2">Ruler id</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((r) => (
              <tr key={String(r.id)} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2">{String(r.name)}</td>
                <td className="p-2">{(r as { ruledBy?: number }).ruledBy ?? "—"}</td>
                <td className="p-2 text-right text-xs">
                  <button
                    type="button"
                    className="text-amber-400/90"
                    onClick={() => {
                      setF({
                        id: String(r.id),
                        name: String(r.name),
                        element: String((r as { element?: string }).element ?? ""),
                        modality: String((r as { modality?: string }).modality ?? ""),
                        ruledBy: (r as { ruledBy?: number | null }).ruledBy != null ? String((r as { ruledBy?: number | null }).ruledBy) : "",
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-rose-400/80"
                    onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}
                  >
                    Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Zodiac" wide>
        <div className="grid gap-2 sm:grid-cols-2">
          {["id", "name", "element", "modality", "ruledBy"].map((k) => (
            <label key={k} className="text-xs text-slate-500">
              {k}
              <input
                className="mt-0.5 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-sm"
                value={f[k as keyof typeof f]}
                onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="text-sm text-slate-500" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-slate-950"
            onClick={() =>
              m.mutate({
                id: +f.id,
                name: f.name,
                element: f.element,
                modality: f.modality,
                ruledBy: f.ruledBy === "" ? null : +f.ruledBy,
              })
            }
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

function AvasthaBlock() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "avastha"],
    queryFn: () => adminApi.get("/admin/planetary-avastha").then((r) => r.data as Record<string, unknown>[]),
  });
  const m = useMutation({
    mutationFn: (row: {
      id: number;
      name: string;
      englishName: string;
      degreeFrom: string;
      degreeTo: string;
      effectPercent: number | null;
    }) => adminApi.put("/admin/planetary-avastha", row),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "avastha"] });
      setOpen(false);
    },
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/planetary-avastha/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "avastha"] }),
  });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    id: "",
    name: "",
    englishName: "",
    degreeFrom: "",
    degreeTo: "",
    effectPercent: "",
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setF({ id: "", name: "", englishName: "", degreeFrom: "", degreeTo: "", effectPercent: "" });
          setOpen(true);
        }}
        className="mb-3 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-slate-950"
      >
        + Add
      </button>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">#</th>
              <th className="p-2">Name</th>
              <th className="p-2">English</th>
              <th className="p-2">° from–to</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((r) => (
              <tr key={String(r.id)} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2">{String(r.name)}</td>
                <td className="p-2">{String((r as { englishName?: string }).englishName)}</td>
                <td className="p-2 text-xs text-slate-500">
                  {(r as { degreeFrom?: string }).degreeFrom} – {(r as { degreeTo?: string }).degreeTo}
                </td>
                <td className="p-2 text-right text-xs">
                  <button
                    type="button"
                    className="text-amber-400/90"
                    onClick={() => {
                      setF({
                        id: String(r.id),
                        name: String(r.name),
                        englishName: String((r as { englishName?: string }).englishName ?? ""),
                        degreeFrom: String((r as { degreeFrom?: string }).degreeFrom ?? ""),
                        degreeTo: String((r as { degreeTo?: string }).degreeTo ?? ""),
                        effectPercent:
                          (r as { effectPercent?: number | null }).effectPercent != null
                            ? String((r as { effectPercent?: number | null }).effectPercent)
                            : "",
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-rose-400/80"
                    onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}
                  >
                    Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Avasthā" wide>
        {["id", "name", "englishName", "degreeFrom", "degreeTo", "effectPercent"].map((k) => (
          <label key={k} className="mb-2 block text-xs text-slate-500">
            {k}
            <input
              className="mt-0.5 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-sm"
              value={f[k as keyof typeof f]}
              onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
            />
          </label>
        ))}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500">
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-slate-950"
            onClick={() =>
              m.mutate({
                id: +f.id,
                name: f.name,
                englishName: f.englishName,
                degreeFrom: f.degreeFrom,
                degreeTo: f.degreeTo,
                effectPercent: f.effectPercent === "" ? null : +f.effectPercent,
              })
            }
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

function RelBlock() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "prel"],
    queryFn: () => adminApi.get("/admin/planet-relationships").then((r) => r.data as Record<string, unknown>[]),
  });
  const c = useMutation({
    mutationFn: (b: { planetId: number; relatedPlanetId: number; isFriendly: number | null | undefined }) =>
      adminApi.post("/admin/planet-relationships", b),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "prel"] }),
  });
  const p = useMutation({
    mutationFn: ({
      planetId,
      relatedPlanetId,
      isFriendly,
    }: {
      planetId: number;
      relatedPlanetId: number;
      isFriendly: number | null;
    }) => adminApi.patch(`/admin/planet-relationships/${planetId}/${relatedPlanetId}`, { isFriendly }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "prel"] }),
  });
  const d = useMutation({
    mutationFn: (x: { a: number; b: number }) => adminApi.delete(`/admin/planet-relationships/${x.a}/${x.b}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "prel"] }),
  });
  const [add, setAdd] = useState({ a: "", b: "", f: "" });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-white/10 p-3">
        <label className="text-xs text-slate-500">
          planet
          <input
            className="mt-0.5 w-20 rounded border border-white/10 bg-black/20 px-2 py-1 text-sm"
            value={add.a}
            onChange={(e) => setAdd((x) => ({ ...x, a: e.target.value }))}
          />
        </label>
        <label className="text-xs text-slate-500">
          related
          <input
            className="mt-0.5 w-20 rounded border border-white/10 bg-black/20 px-2 py-1 text-sm"
            value={add.b}
            onChange={(e) => setAdd((x) => ({ ...x, b: e.target.value }))}
          />
        </label>
        <label className="text-xs text-slate-500">
          friendly? (-1/0/1)
          <input
            className="mt-0.5 w-20 rounded border border-white/10 bg-black/20 px-2 py-1 text-sm"
            value={add.f}
            onChange={(e) => setAdd((x) => ({ ...x, f: e.target.value }))}
          />
        </label>
        <button
          type="button"
          className="rounded bg-amber-500 px-2 py-1 text-xs font-medium text-slate-950"
          onClick={() =>
            c.mutate({
              planetId: +add.a,
              relatedPlanetId: +add.b,
              isFriendly: add.f === "" ? null : +add.f,
            })
          }
        >
          Add
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">P</th>
              <th className="p-2">Rel</th>
              <th className="p-2">Friend</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((r) => {
              const pid = r.planetId as number;
              const rid = (r as { relatedPlanetId: number }).relatedPlanetId;
              return (
                <tr key={`${pid}-${rid}`} className="border-b border-white/5">
                  <td className="p-2 font-mono text-xs">{pid}</td>
                  <td className="p-2 font-mono text-xs">{rid}</td>
                  <td className="p-2">
                    <input
                      className="w-16 rounded border border-white/10 bg-black/20 px-1 py-0.5 text-xs"
                      defaultValue={(r as { isFriendly?: number | null }).isFriendly ?? ""}
                      onBlur={(e) => {
                        const v = e.target.value;
                        p.mutate({
                          planetId: pid,
                          relatedPlanetId: rid,
                          isFriendly: v === "" ? null : +v,
                        });
                      }}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      className="text-rose-400/80"
                      onClick={() =>
                        window.confirm("Delete?") && d.mutate({ a: pid, b: rid })
                      }
                    >
                      Del
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PhiBlock() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "phi"],
    queryFn: () => adminApi.get("/admin/planet-house-interpretations").then((r) => r.data as Record<string, unknown>[]),
  });
  const c = useMutation({
    mutationFn: (b: { planetId: number; houseId: number; interpretation: string }) =>
      adminApi.post("/admin/planet-house-interpretations", b),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "phi"] });
      setOpen(false);
    },
  });
  const u = useMutation({
    mutationFn: (b: { id: number; planetId: number; houseId: number; interpretation: string }) =>
      adminApi.patch(`/admin/planet-house-interpretations/${b.id}`, b),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "phi"] });
      setOpen(false);
    },
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/planet-house-interpretations/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "phi"] }),
  });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ id: "", planetId: "", houseId: "", interpretation: "" });
  const [mode, setMode] = useState<"new" | "edit">("new");

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setMode("new");
          setF({ id: "", planetId: "", houseId: "", interpretation: "" });
          setOpen(true);
        }}
        className="mb-3 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-slate-950"
      >
        + Add
      </button>
      <div className="max-h-[60vh] overflow-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="sticky top-0 border-b border-white/10 bg-[#0c0e14] text-xs text-slate-500">
              <th className="p-2">#</th>
              <th className="p-2">P</th>
              <th className="p-2">H</th>
              <th className="p-2">Text</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((r) => (
              <tr key={r.id as number} className="border-b border-white/5 align-top">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2 font-mono text-xs">{(r as { planetId: number }).planetId}</td>
                <td className="p-2 font-mono text-xs">{(r as { houseId: number }).houseId}</td>
                <td className="max-w-md p-2 text-xs text-slate-400">{(r as { interpretation: string }).interpretation.slice(0, 120)}…</td>
                <td className="p-2 text-right text-xs">
                  <button
                    type="button"
                    className="text-amber-400/90"
                    onClick={() => {
                      setMode("edit");
                      setF({
                        id: String(r.id),
                        planetId: String((r as { planetId: number }).planetId),
                        houseId: String((r as { houseId: number }).houseId),
                        interpretation: (r as { interpretation: string }).interpretation,
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-rose-400/80"
                    onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}
                  >
                    Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={mode === "new" ? "New PHI" : "Edit PHI"} wide>
        <div className="space-y-2">
          {mode === "edit" && (
            <input type="hidden" value={f.id} readOnly className="hidden" />
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate-500">
              planetId
              <input
                className="mt-0.5 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-sm"
                value={f.planetId}
                onChange={(e) => setF((x) => ({ ...x, planetId: e.target.value }))}
              />
            </label>
            <label className="text-xs text-slate-500">
              houseId
              <input
                className="mt-0.5 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-sm"
                value={f.houseId}
                onChange={(e) => setF((x) => ({ ...x, houseId: e.target.value }))}
              />
            </label>
          </div>
          <label className="text-xs text-slate-500">
            interpretation
            <textarea
              className="mt-0.5 min-h-[200px] w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-sm"
              value={f.interpretation}
              onChange={(e) => setF((x) => ({ ...x, interpretation: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="text-sm text-slate-500" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-slate-950"
            onClick={() => {
              if (mode === "new") {
                void c.mutate({
                  planetId: +f.planetId,
                  houseId: +f.houseId,
                  interpretation: f.interpretation,
                });
              } else {
                void u.mutate({
                  id: +f.id,
                  planetId: +f.planetId,
                  houseId: +f.houseId,
                  interpretation: f.interpretation,
                });
              }
            }}
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

function DrishtiBlock() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "drishti"],
    queryFn: () => adminApi.get("/admin/planet-drishti").then((r) => r.data as Record<string, unknown>[]),
  });
  const c = useMutation({
    mutationFn: (b: {
      planetId: number;
      occupantHouseId: number;
      aspectedHouseId: number;
      sortOrder: number;
    }) => adminApi.post("/admin/planet-drishti", b),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "drishti"] });
      setOpen(false);
    },
  });
  const u = useMutation({
    mutationFn: (b: {
      id: number;
      planetId: number;
      occupantHouseId: number;
      aspectedHouseId: number;
      sortOrder: number;
    }) => adminApi.patch(`/admin/planet-drishti/${b.id}`, b),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "drishti"] });
      setOpen(false);
    },
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/planet-drishti/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "drishti"] }),
  });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    id: "",
    planetId: "",
    occupantHouseId: "",
    aspectedHouseId: "",
    sortOrder: "0",
  });
  const [mode, setMode] = useState<"new" | "edit">("new");

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setMode("new");
          setF({ id: "", planetId: "", occupantHouseId: "", aspectedHouseId: "", sortOrder: "0" });
          setOpen(true);
        }}
        className="mb-3 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-slate-950"
      >
        + Add
      </button>
      <div className="max-h-[60vh] overflow-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="sticky top-0 border-b border-white/10 bg-[#0c0e14] text-xs text-slate-500">
              <th className="p-2">#</th>
              <th className="p-2">P</th>
              <th className="p-2">Occ</th>
              <th className="p-2">Asp</th>
              <th className="p-2">ord</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((r) => (
              <tr key={r.id as number} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2 font-mono text-xs">{(r as { planetId: number }).planetId}</td>
                <td className="p-2 font-mono text-xs">{(r as { occupantHouseId: number }).occupantHouseId}</td>
                <td className="p-2 font-mono text-xs">{(r as { aspectedHouseId: number }).aspectedHouseId}</td>
                <td className="p-2">{(r as { sortOrder: number }).sortOrder}</td>
                <td className="p-2 text-right text-xs">
                  <button
                    type="button"
                    className="text-amber-400/90"
                    onClick={() => {
                      setMode("edit");
                      setF({
                        id: String(r.id),
                        planetId: String((r as { planetId: number }).planetId),
                        occupantHouseId: String((r as { occupantHouseId: number }).occupantHouseId),
                        aspectedHouseId: String((r as { aspectedHouseId: number }).aspectedHouseId),
                        sortOrder: String((r as { sortOrder: number }).sortOrder),
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-rose-400/80"
                    onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}
                  >
                    Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={mode === "new" ? "New drishti" : "Edit drishti"} wide>
        {(["planetId", "occupantHouseId", "aspectedHouseId", "sortOrder"] as const).map((k) => (
          <label key={k} className="mb-2 block text-xs text-slate-500">
            {k}
            <input
              className="mt-0.5 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-sm"
              value={f[k]}
              onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
            />
          </label>
        ))}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="text-sm text-slate-500" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-slate-950"
            onClick={() => {
              if (mode === "new") {
                void c.mutate({
                  planetId: +f.planetId,
                  occupantHouseId: +f.occupantHouseId,
                  aspectedHouseId: +f.aspectedHouseId,
                  sortOrder: +f.sortOrder || 0,
                });
              } else {
                void u.mutate({
                  id: +f.id,
                  planetId: +f.planetId,
                  occupantHouseId: +f.occupantHouseId,
                  aspectedHouseId: +f.aspectedHouseId,
                  sortOrder: +f.sortOrder || 0,
                });
              }
            }}
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}
