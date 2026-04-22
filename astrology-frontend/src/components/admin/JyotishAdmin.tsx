"use client";

import {
  AdminField,
  AdminFilterGrid,
  AdminPageHeader,
  AdminPanel,
  AdminTableScroll,
  AdminToolbar,
  adminInput,
  adminTh,
} from "@/components/admin/admin-ui";
import { Modal } from "@/components/admin/Modal";
import adminApi from "@/lib/adminApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

const TABS = [
  { key: "planets" as const, label: "Planets" },
  { key: "houses" as const, label: "Houses" },
  { key: "zodiac" as const, label: "Zodiac" },
  { key: "avastha" as const, label: "Avastha" },
  { key: "rel" as const, label: "Planet rel." },
  { key: "phi" as const, label: "PHI" },
  { key: "drishti" as const, label: "Drishti" },
];

const inputClass = adminInput;
const selectClass =
  "w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20";
const TH = adminTh + " px-4 py-3";
const addBtn =
  "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-md shadow-cyan-950/25 transition hover:from-cyan-400 hover:to-cyan-300";
const btnP =
  "inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-amber-500/15 hover:text-amber-300";
const btnT =
  "inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-500/15 hover:text-rose-400";

function IconPencil() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 2.5L2 9v3h3l6.5-6.5-3-3zM6 4l3 3" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4.5h9M5 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M4.5 4.5l.5 8h4l.5-8" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 1v10M1 6h10" />
    </svg>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative shrink-0 rounded-t-md px-4 py-2.5 text-sm font-medium transition",
        active
          ? "text-white after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:rounded-t-full after:bg-cyan-500"
          : "text-zinc-500 hover:text-zinc-300",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function BlockSkel({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, r) => (
        <tr key={r} className={r % 2 ? "bg-white/[0.015]" : ""}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-4 w-full max-w-[8rem] animate-pulse rounded bg-slate-700/30" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function friendlyLabel(v: number | null) {
  if (v === 1) {
    return <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">Friendly</span>;
  }
  if (v === -1) {
    return <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] text-rose-300">Enemy</span>;
  }
  return <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] text-zinc-400">Neutral</span>;
}

type TabKey = (typeof TABS)[number]["key"];

export function JyotishAdmin() {
  const [tab, setTab] = useState<TabKey>("planets");
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Jyotish reference data"
        subtitle="Small reference tables loaded in full — use column filters to narrow rows before editing."
      />
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-white/[0.07] pb-px">
        {TABS.map((t) => (
          <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </TabBtn>
        ))}
      </div>
      <AdminPanel className="p-0">
        <div className="p-4 sm:p-5">
          {tab === "planets" && <PlanetsBlock />}
          {tab === "houses" && <HousesBlock />}
          {tab === "zodiac" && <ZodiacBlock />}
          {tab === "avastha" && <AvasthaBlock />}
          {tab === "rel" && <RelBlock />}
          {tab === "phi" && <PhiBlock />}
          {tab === "drishti" && <DrishtiBlock />}
        </div>
      </AdminPanel>
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
    mutationFn: (row: { id: number; name: string; sanskritName: string; type: string }) => adminApi.put("/admin/planets", row),
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
  const [pfId, setPfId] = useState("");
  const [pfName, setPfName] = useState("");
  const [pfSanskrit, setPfSanskrit] = useState("");
  const [pfType, setPfType] = useState("");
  const planetRows = useMemo(() => {
    let rows = q.data ?? [];
    if (pfId.trim()) rows = rows.filter((r) => String(r.id).includes(pfId.trim()));
    if (pfName.trim()) rows = rows.filter((r) => String(r.name ?? "").toLowerCase().includes(pfName.trim().toLowerCase()));
    if (pfSanskrit.trim())
      rows = rows.filter((r) =>
        String((r as { sanskritName?: string }).sanskritName ?? "")
          .toLowerCase()
          .includes(pfSanskrit.trim().toLowerCase()),
      );
    if (pfType.trim()) rows = rows.filter((r) => String(r.type ?? "").toLowerCase().includes(pfType.trim().toLowerCase()));
    return rows;
  }, [q.data, pfId, pfName, pfSanskrit, pfType]);

  return (
    <div>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Filter id contains">
            <input className={inputClass} value={pfId} onChange={(e) => setPfId(e.target.value)} />
          </AdminField>
          <AdminField label="Filter name">
            <input className={inputClass} value={pfName} onChange={(e) => setPfName(e.target.value)} />
          </AdminField>
          <AdminField label="Filter Sanskrit">
            <input className={inputClass} value={pfSanskrit} onChange={(e) => setPfSanskrit(e.target.value)} />
          </AdminField>
          <AdminField label="Filter type">
            <input className={inputClass} value={pfType} onChange={(e) => setPfType(e.target.value)} placeholder="planet…" />
          </AdminField>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setF({ id: "", name: "", sanskritName: "", type: "planet" });
                setOpen(true);
              }}
              className={addBtn}
            >
              <IconPlus />
              Add
            </button>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-zinc-900/60">
              <th className={TH}>#</th>
              <th className={TH}>Name</th>
              <th className={TH}>Sanskrit</th>
              <th className={TH}>Type</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {!q.data && <BlockSkel cols={5} />}
            {planetRows.map((r) => (
              <tr key={String(r.id)} className="transition hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.id as number}</td>
                <td className="px-4 py-3">{String(r.name ?? "")}</td>
                <td className="px-4 py-3">{String((r as { sanskritName?: string }).sanskritName ?? "")}</td>
                <td className="px-4 py-3 text-zinc-500">{String(r.type ?? "")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className={btnP}
                      title="Edit"
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
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      className={btnT}
                      title="Delete"
                      onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableScroll>
      <Modal open={open} onClose={() => setOpen(false)} title="Planet">
        <div className="space-y-2">
          {(
            [
              ["id", f.id, (v: string) => setF((x) => ({ ...x, id: v }))],
              ["name", f.name, (v: string) => setF((x) => ({ ...x, name: v }))],
              ["sanskritName", f.sanskritName, (v: string) => setF((x) => ({ ...x, sanskritName: v }))],
              ["type", f.type, (v: string) => setF((x) => ({ ...x, type: v }))],
            ] as const
          ).map(([k, v, on]) => (
            <label key={k} className="block text-xs text-zinc-500">
              {k}
              <input className={inputClass } value={v} onChange={(e) => on(e.target.value)} />
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <button type="button" className="text-sm text-zinc-500" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-md shadow-amber-900/20 transition hover:bg-amber-400 disabled:opacity-40"
            onClick={() => void m.mutate({ id: +f.id, name: f.name, sanskritName: f.sanskritName, type: f.type })}
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
    mutationFn: (row: { id: number; name: string; mainTheme: string; represents: string }) => adminApi.put("/admin/houses", row),
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
  const [hfId, setHfId] = useState("");
  const [hfName, setHfName] = useState("");
  const [hfTheme, setHfTheme] = useState("");
  const [hfRep, setHfRep] = useState("");
  const houseRows = useMemo(() => {
    let rows = q.data ?? [];
    if (hfId.trim()) rows = rows.filter((r) => String(r.id).includes(hfId.trim()));
    if (hfName.trim()) rows = rows.filter((r) => String(r.name).toLowerCase().includes(hfName.trim().toLowerCase()));
    if (hfTheme.trim())
      rows = rows.filter((r) =>
        String((r as { mainTheme?: string }).mainTheme ?? "")
          .toLowerCase()
          .includes(hfTheme.trim().toLowerCase()),
      );
    if (hfRep.trim())
      rows = rows.filter((r) =>
        String((r as { represents?: string }).represents ?? "")
          .toLowerCase()
          .includes(hfRep.trim().toLowerCase()),
      );
    return rows;
  }, [q.data, hfId, hfName, hfTheme, hfRep]);

  return (
    <div>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Filter id">
            <input className={inputClass} value={hfId} onChange={(e) => setHfId(e.target.value)} />
          </AdminField>
          <AdminField label="Filter name">
            <input className={inputClass} value={hfName} onChange={(e) => setHfName(e.target.value)} />
          </AdminField>
          <AdminField label="Filter theme">
            <input className={inputClass} value={hfTheme} onChange={(e) => setHfTheme(e.target.value)} />
          </AdminField>
          <AdminField label="Filter represents">
            <input className={inputClass} value={hfRep} onChange={(e) => setHfRep(e.target.value)} />
          </AdminField>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setF({ id: "", name: "", mainTheme: "", represents: "" });
                setOpen(true);
              }}
              className={addBtn}
            >
              <IconPlus />
              Add
            </button>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-zinc-900/60">
              <th className={TH}>#</th>
              <th className={TH}>Name</th>
              <th className={TH}>Theme</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {!q.data && <BlockSkel cols={4} />}
            {houseRows.map((r) => (
              <tr key={String(r.id)} className="transition hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.id as number}</td>
                <td className="px-4 py-3">{String(r.name)}</td>
                <td className="px-4 py-3 text-zinc-400">{String((r as { mainTheme?: string }).mainTheme)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className={btnP}
                      title="Edit"
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
                      <IconPencil />
                    </button>
                    <button type="button" className={btnT} title="Delete" onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}>
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableScroll>
      <Modal open={open} onClose={() => setOpen(false)} title="House" wide>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["id", f.id, (v: string) => setF((x) => ({ ...x, id: v }))],
              ["name", f.name, (v: string) => setF((x) => ({ ...x, name: v }))],
            ] as const
          ).map(([k, v, on]) => (
            <label key={k} className="text-xs text-zinc-500">
              {k}
              <input className={inputClass } value={v} onChange={(e) => on(e.target.value)} />
            </label>
          ))}
          <label className="col-span-full flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
            mainTheme
            <input className={inputClass } value={f.mainTheme} onChange={(e) => setF((x) => ({ ...x, mainTheme: e.target.value }))} />
          </label>
          <label className="col-span-full flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
            represents
            <textarea
              className={inputClass + " min-h-[80px]"}
              value={f.represents}
              onChange={(e) => setF((x) => ({ ...x, represents: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <button type="button" className="text-sm text-zinc-500" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-md shadow-amber-900/20 transition hover:bg-amber-400"
            onClick={() => void m.mutate({ id: +f.id, name: f.name, mainTheme: f.mainTheme, represents: f.represents })}
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
  const planets = useQuery({
    queryKey: ["admin", "planets"],
    queryFn: () => adminApi.get<{ id: number; name: string }[]>("/admin/planets").then((r) => r.data),
    staleTime: Infinity,
  });
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
  const [zfId, setZfId] = useState("");
  const [zfName, setZfName] = useState("");
  const [zfEl, setZfEl] = useState("");
  const [zfMod, setZfMod] = useState("");
  const [zfRuler, setZfRuler] = useState("");

  const planetName = (id: number | null | undefined) =>
    id == null ? "—" : (planets.data?.find((p) => p.id === id)?.name ?? `#${id}`);

  const zodiacRows = useMemo(() => {
    let rows = q.data ?? [];
    if (zfId.trim()) rows = rows.filter((r) => String(r.id).includes(zfId.trim()));
    if (zfName.trim()) rows = rows.filter((r) => String(r.name).toLowerCase().includes(zfName.trim().toLowerCase()));
    if (zfEl.trim()) rows = rows.filter((r) => String((r as { element?: string }).element ?? "").toLowerCase().includes(zfEl.trim().toLowerCase()));
    if (zfMod.trim())
      rows = rows.filter((r) => String((r as { modality?: string }).modality ?? "").toLowerCase().includes(zfMod.trim().toLowerCase()));
    if (zfRuler.trim()) {
      const t = zfRuler.trim().toLowerCase();
      rows = rows.filter((r) => {
        const rb = (r as { ruledBy?: number | null }).ruledBy;
        const pn = planetName(rb).toLowerCase();
        return String(rb ?? "").includes(zfRuler.trim()) || pn.includes(t);
      });
    }
    return rows;
  }, [q.data, zfId, zfName, zfEl, zfMod, zfRuler, planets.data]);

  return (
    <div>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Filter id">
            <input className={inputClass} value={zfId} onChange={(e) => setZfId(e.target.value)} />
          </AdminField>
          <AdminField label="Filter sign name">
            <input className={inputClass} value={zfName} onChange={(e) => setZfName(e.target.value)} />
          </AdminField>
          <AdminField label="Filter element">
            <input className={inputClass} value={zfEl} onChange={(e) => setZfEl(e.target.value)} />
          </AdminField>
          <AdminField label="Filter modality">
            <input className={inputClass} value={zfMod} onChange={(e) => setZfMod(e.target.value)} />
          </AdminField>
          <AdminField label="Filter ruler (id or name)">
            <input className={inputClass} value={zfRuler} onChange={(e) => setZfRuler(e.target.value)} />
          </AdminField>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setF({ id: "", name: "", element: "", modality: "", ruledBy: "" });
                setOpen(true);
              }}
              className={addBtn}
            >
              <IconPlus />
              Add
            </button>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-zinc-900/60">
              <th className={TH}>#</th>
              <th className={TH}>Sign</th>
              <th className={TH}>Element</th>
              <th className={TH}>Mode</th>
              <th className={TH}>Ruler</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {!q.data && <BlockSkel cols={6} />}
            {zodiacRows.map((r) => {
              const el = (r as { element?: string }).element;
              const mo = (r as { modality?: string }).modality;
              const rb = (r as { ruledBy?: number | null }).ruledBy;
              return (
                <tr key={String(r.id)} className="transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.id as number}</td>
                  <td className="p-2 font-medium text-zinc-100">{String(r.name)}</td>
                  <td className="px-4 py-3">
                    {el ? <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-200/80">{el}</span> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {mo ? <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[11px] text-sky-200/80">{mo}</span> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {rb != null ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-zinc-100">{planetName(rb)}</span>
                        <span className="rounded bg-amber-500/10 px-1 font-mono text-[10px] text-amber-300/60">#{rb}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className={btnP}
                        title="Edit"
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
                        <IconPencil />
                      </button>
                      <button type="button" className={btnT} title="Delete" onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}>
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableScroll>
      <Modal open={open} onClose={() => setOpen(false)} title="Zodiac" wide>
        <div className="grid gap-2 sm:grid-cols-2">
          {["id", "name", "element", "modality"].map((k) => (
            <label key={k} className="text-xs text-zinc-500">
              {k}
              <input
                className={inputClass }
                value={f[k as keyof typeof f]}
                onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
              />
            </label>
          ))}
          <label className="col-span-full flex flex-col gap-1.5 text-xs font-medium text-zinc-400 sm:col-span-2">
            Ruled by (planet)
            <select
              className={selectClass }
              value={f.ruledBy}
              onChange={(e) => setF((x) => ({ ...x, ruledBy: e.target.value }))}
            >
              <option value="">— none —</option>
              {planets.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <button type="button" className="text-sm text-zinc-500" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-md shadow-amber-900/20 transition hover:bg-amber-400"
            onClick={() =>
              void m.mutate({
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
  const [afId, setAfId] = useState("");
  const [afName, setAfName] = useState("");
  const [afEn, setAfEn] = useState("");
  const [afDeg, setAfDeg] = useState("");
  const avRows = useMemo(() => {
    let rows = q.data ?? [];
    if (afId.trim()) rows = rows.filter((r) => String(r.id).includes(afId.trim()));
    if (afName.trim()) rows = rows.filter((r) => String(r.name).toLowerCase().includes(afName.trim().toLowerCase()));
    if (afEn.trim())
      rows = rows.filter((r) =>
        String((r as { englishName?: string }).englishName ?? "")
          .toLowerCase()
          .includes(afEn.trim().toLowerCase()),
      );
    if (afDeg.trim()) {
      const t = afDeg.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          String((r as { degreeFrom?: string }).degreeFrom ?? "")
            .toLowerCase()
            .includes(t) ||
          String((r as { degreeTo?: string }).degreeTo ?? "")
            .toLowerCase()
            .includes(t),
      );
    }
    return rows;
  }, [q.data, afId, afName, afEn, afDeg]);

  return (
    <div>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Filter id">
            <input className={inputClass} value={afId} onChange={(e) => setAfId(e.target.value)} />
          </AdminField>
          <AdminField label="Filter name">
            <input className={inputClass} value={afName} onChange={(e) => setAfName(e.target.value)} />
          </AdminField>
          <AdminField label="Filter English">
            <input className={inputClass} value={afEn} onChange={(e) => setAfEn(e.target.value)} />
          </AdminField>
          <AdminField label="Filter degrees">
            <input className={inputClass} value={afDeg} onChange={(e) => setAfDeg(e.target.value)} placeholder="from / to" />
          </AdminField>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setF({ id: "", name: "", englishName: "", degreeFrom: "", degreeTo: "", effectPercent: "" });
                setOpen(true);
              }}
              className={addBtn}
            >
              <IconPlus />
              Add
            </button>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-zinc-900/60">
              <th className={TH}>#</th>
              <th className={TH}>Name</th>
              <th className={TH}>English</th>
              <th className={TH}>° from–to</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {!q.data && <BlockSkel cols={5} />}
            {avRows.map((r) => (
              <tr key={String(r.id)} className="transition hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.id as number}</td>
                <td className="px-4 py-3">{String(r.name)}</td>
                <td className="px-4 py-3">{String((r as { englishName?: string }).englishName)}</td>
                <td className="p-2 text-xs text-zinc-500">
                  {(r as { degreeFrom?: string }).degreeFrom} – {(r as { degreeTo?: string }).degreeTo}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className={btnP}
                      title="Edit"
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
                      <IconPencil />
                    </button>
                    <button type="button" className={btnT} title="Delete" onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}>
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableScroll>
      <Modal open={open} onClose={() => setOpen(false)} title="Avasthā" wide>
        {["id", "name", "englishName", "degreeFrom", "degreeTo", "effectPercent"].map((k) => (
          <label key={k} className="mb-2 block text-xs text-zinc-500">
            {k}
            <input
              className={inputClass }
              value={f[k as keyof typeof f]}
              onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
            />
          </label>
        ))}
        <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-500">
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
            onClick={() =>
              void m.mutate({
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
  const planets = useQuery({
    queryKey: ["admin", "planets"],
    queryFn: () => adminApi.get<{ id: number; name: string }[]>("/admin/planets").then((r) => r.data),
    staleTime: Infinity,
  });
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
  const [rfA, setRfA] = useState("");
  const [rfB, setRfB] = useState("");
  const [rfRel, setRfRel] = useState("");

  const pName = (id: number) => planets.data?.find((x) => x.id === id)?.name ?? `#${id}`;

  const relRows = useMemo(() => {
    let rows = q.data ?? [];
    if (rfA.trim()) {
      const t = rfA.trim().toLowerCase();
      rows = rows.filter((r) => {
        const pid = r.planetId as number;
        return String(pid).includes(rfA.trim()) || pName(pid).toLowerCase().includes(t);
      });
    }
    if (rfB.trim()) {
      const t = rfB.trim().toLowerCase();
      rows = rows.filter((r) => {
        const rid = (r as { relatedPlanetId: number }).relatedPlanetId;
        return String(rid).includes(rfB.trim()) || pName(rid).toLowerCase().includes(t);
      });
    }
    if (rfRel !== "") {
      const v = rfRel === "null" ? null : +rfRel;
      rows = rows.filter((r) => {
        const fr = (r as { isFriendly?: number | null }).isFriendly ?? null;
        if (v === null) return fr === null || fr === undefined;
        return fr === v;
      });
    }
    return rows;
  }, [q.data, rfA, rfB, rfRel, planets.data]);

  return (
    <div>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Filter planet A (id or name)">
            <input className={inputClass} value={rfA} onChange={(e) => setRfA(e.target.value)} />
          </AdminField>
          <AdminField label="Filter planet B (id or name)">
            <input className={inputClass} value={rfB} onChange={(e) => setRfB(e.target.value)} />
          </AdminField>
          <AdminField label="Filter relation">
            <select className={selectClass} value={rfRel} onChange={(e) => setRfRel(e.target.value)}>
              <option value="">Any</option>
              <option value="1">Friendly</option>
              <option value="0">Neutral</option>
              <option value="-1">Enemy</option>
              <option value="null">Unset</option>
            </select>
          </AdminField>
        </AdminFilterGrid>
      </AdminToolbar>
      <div className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-white/[0.07] bg-zinc-900/40 p-4">
        <label className="min-w-[140px] flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Planet
          <select className={selectClass } value={add.a} onChange={(e) => setAdd((x) => ({ ...x, a: e.target.value }))}>
            <option value="">—</option>
            {planets.data?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[140px] flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Related
          <select className={selectClass } value={add.b} onChange={(e) => setAdd((x) => ({ ...x, b: e.target.value }))}>
            <option value="">—</option>
            {planets.data?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[160px] flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Relation
          <select className={selectClass } value={add.f} onChange={(e) => setAdd((x) => ({ ...x, f: e.target.value }))}>
            <option value="">—</option>
            <option value="1">Friendly</option>
            <option value="0">Neutral</option>
            <option value="-1">Enemy</option>
          </select>
        </label>
        <button
          type="button"
          className={addBtn + " self-end"}
          onClick={() =>
            add.a &&
            add.b &&
            c.mutate({
              planetId: +add.a,
              relatedPlanetId: +add.b,
              isFriendly: add.f === "" ? null : +add.f,
            })
          }
        >
          <IconPlus />
          Add
        </button>
      </div>
      <AdminTableScroll>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-zinc-900/60">
              <th className={TH}>P</th>
              <th className={TH}>Rel</th>
              <th className={TH}>Friend</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {!q.data && <BlockSkel cols={4} />}
            {relRows.map((r) => {
              const pid = r.planetId as number;
              const rid = (r as { relatedPlanetId: number }).relatedPlanetId;
              const fr = (r as { isFriendly?: number | null }).isFriendly ?? null;
              return (
                <tr key={`${pid}-${rid}`} className="transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className="text-zinc-100">{pName(pid)}</span>
                    <span className="ml-1 rounded bg-white/[0.04] px-1 font-mono text-[10px] text-zinc-600">#{pid}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-100">{pName(rid)}</span>
                    <span className="ml-1 rounded bg-white/[0.04] px-1 font-mono text-[10px] text-zinc-600">#{rid}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {friendlyLabel(fr)}
                      <select
                        className="min-w-[7rem] rounded-md border border-white/10 bg-[#080a0e]/60 px-2 py-1 text-[11px] text-zinc-300"
                        value={fr === null || fr === undefined ? "" : String(fr)}
                        onChange={(e) => {
                          const v = e.target.value;
                          void p.mutate({
                            planetId: pid,
                            relatedPlanetId: rid,
                            isFriendly: v === "" ? null : +v,
                          });
                        }}
                      >
                        <option value="">—</option>
                        <option value="1">Friendly</option>
                        <option value="0">Neutral</option>
                        <option value="-1">Enemy</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className={btnT}
                      title="Delete"
                      onClick={() => window.confirm("Delete?") && d.mutate({ a: pid, b: rid })}
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableScroll>
    </div>
  );
}

function PhiBlock() {
  const qc = useQueryClient();
  const planets = useQuery({
    queryKey: ["admin", "planets"],
    queryFn: () => adminApi.get<{ id: number; name: string }[]>("/admin/planets").then((r) => r.data),
    staleTime: Infinity,
  });
  const houses = useQuery({
    queryKey: ["admin", "houses"],
    queryFn: () => adminApi.get<{ id: number; name: string }[]>("/admin/houses").then((r) => r.data),
    staleTime: Infinity,
  });
  const q = useQuery({
    queryKey: ["admin", "phi"],
    queryFn: () => adminApi.get("/admin/planet-house-interpretations").then((r) => r.data as Record<string, unknown>[]),
  });
  const c = useMutation({
    mutationFn: (b: { planetId: number; houseId: number; interpretation: string }) => adminApi.post("/admin/planet-house-interpretations", b),
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
  const [phId, setPhId] = useState("");
  const [phPlanet, setPhPlanet] = useState("");
  const [phHouse, setPhHouse] = useState("");
  const [phText, setPhText] = useState("");

  const pName = (id: number) => planets.data?.find((x) => x.id === id)?.name ?? `#${id}`;
  const hName = (id: number) => houses.data?.find((x) => x.id === id)?.name ?? `House ${id}`;

  const phiRows = useMemo(() => {
    let rows = q.data ?? [];
    if (phId.trim()) rows = rows.filter((r) => String(r.id).includes(phId.trim()));
    if (phPlanet.trim()) {
      const t = phPlanet.trim().toLowerCase();
      rows = rows.filter((r) => {
        const pId = (r as { planetId: number }).planetId;
        return String(pId).includes(phPlanet.trim()) || pName(pId).toLowerCase().includes(t);
      });
    }
    if (phHouse.trim()) {
      const t = phHouse.trim().toLowerCase();
      rows = rows.filter((r) => {
        const hId = (r as { houseId: number }).houseId;
        return String(hId).includes(phHouse.trim()) || hName(hId).toLowerCase().includes(t);
      });
    }
    if (phText.trim()) {
      const t = phText.trim().toLowerCase();
      rows = rows.filter((r) => (r as { interpretation: string }).interpretation.toLowerCase().includes(t));
    }
    return rows;
  }, [q.data, phId, phPlanet, phHouse, phText, planets.data, houses.data]);

  return (
    <div>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Row id">
            <input className={inputClass} value={phId} onChange={(e) => setPhId(e.target.value)} />
          </AdminField>
          <AdminField label="Planet (id or name)">
            <input className={inputClass} value={phPlanet} onChange={(e) => setPhPlanet(e.target.value)} />
          </AdminField>
          <AdminField label="House (id or name)">
            <input className={inputClass} value={phHouse} onChange={(e) => setPhHouse(e.target.value)} />
          </AdminField>
          <AdminField label="Interpretation contains">
            <input className={inputClass} value={phText} onChange={(e) => setPhText(e.target.value)} />
          </AdminField>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setMode("new");
                setF({ id: "", planetId: "", houseId: "", interpretation: "" });
                setOpen(true);
              }}
              className={addBtn}
            >
              <IconPlus />
              Add
            </button>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="sticky top-0 border-b border-white/[0.07] bg-zinc-900/60">
              <th className={TH}>#</th>
              <th className={TH}>P</th>
              <th className={TH}>H</th>
              <th className={TH}>Text</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {!q.data && <BlockSkel cols={5} />}
            {phiRows.map((r) => {
              const pId = (r as { planetId: number }).planetId;
              const hId = (r as { houseId: number }).houseId;
              return (
                <tr key={r.id as number} className="align-top transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.id as number}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[12px] text-amber-200/90">{pName(pId)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[12px] text-sky-200/90">{hName(hId)}</span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-zinc-500">{(r as { interpretation: string }).interpretation.slice(0, 120)}…</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className={btnP}
                        title="Edit"
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
                        <IconPencil />
                      </button>
                      <button type="button" className={btnT} title="Delete" onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}>
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableScroll>
      <Modal open={open} onClose={() => setOpen(false)} title={mode === "new" ? "New PHI" : "Edit PHI"} wide>
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
              Planet
              <select
                className={selectClass }
                value={f.planetId}
                onChange={(e) => setF((x) => ({ ...x, planetId: e.target.value }))}
              >
                <option value="">—</option>
                {planets.data?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
              House
              <select
                className={selectClass }
                value={f.houseId}
                onChange={(e) => setF((x) => ({ ...x, houseId: e.target.value }))}
              >
                <option value="">—</option>
                {houses.data?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
            interpretation
            <textarea
              className={inputClass + " min-h-[200px]"}
              value={f.interpretation}
              onChange={(e) => setF((x) => ({ ...x, interpretation: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <button type="button" className="text-sm text-zinc-500" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
            onClick={() => {
              if (mode === "new") {
                void c.mutate({ planetId: +f.planetId, houseId: +f.houseId, interpretation: f.interpretation });
              } else {
                void u.mutate({ id: +f.id, planetId: +f.planetId, houseId: +f.houseId, interpretation: f.interpretation });
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
  const planets = useQuery({
    queryKey: ["admin", "planets"],
    queryFn: () => adminApi.get<{ id: number; name: string }[]>("/admin/planets").then((r) => r.data),
    staleTime: Infinity,
  });
  const houses = useQuery({
    queryKey: ["admin", "houses"],
    queryFn: () => adminApi.get<{ id: number; name: string }[]>("/admin/houses").then((r) => r.data),
    staleTime: Infinity,
  });
  const q = useQuery({
    queryKey: ["admin", "drishti"],
    queryFn: () => adminApi.get("/admin/planet-drishti").then((r) => r.data as Record<string, unknown>[]),
  });
  const c = useMutation({
    mutationFn: (b: { planetId: number; occupantHouseId: number; aspectedHouseId: number; sortOrder: number }) =>
      adminApi.post("/admin/planet-drishti", b),
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
  const [drId, setDrId] = useState("");
  const [drP, setDrP] = useState("");
  const [drO, setDrO] = useState("");
  const [drA, setDrA] = useState("");
  const [drOrd, setDrOrd] = useState("");

  const pName = (id: number) => planets.data?.find((x) => x.id === id)?.name ?? `#${id}`;
  const hName = (id: number) => houses.data?.find((x) => x.id === id)?.name ?? `House ${id}`;

  const drishtiRows = useMemo(() => {
    let rows = q.data ?? [];
    if (drId.trim()) rows = rows.filter((r) => String(r.id).includes(drId.trim()));
    if (drP.trim()) {
      const t = drP.trim().toLowerCase();
      rows = rows.filter((r) => {
        const pId = (r as { planetId: number }).planetId;
        return String(pId).includes(drP.trim()) || pName(pId).toLowerCase().includes(t);
      });
    }
    if (drO.trim()) {
      const t = drO.trim().toLowerCase();
      rows = rows.filter((r) => {
        const o = (r as { occupantHouseId: number }).occupantHouseId;
        return String(o).includes(drO.trim()) || hName(o).toLowerCase().includes(t);
      });
    }
    if (drA.trim()) {
      const t = drA.trim().toLowerCase();
      rows = rows.filter((r) => {
        const a = (r as { aspectedHouseId: number }).aspectedHouseId;
        return String(a).includes(drA.trim()) || hName(a).toLowerCase().includes(t);
      });
    }
    if (drOrd.trim()) rows = rows.filter((r) => String((r as { sortOrder: number }).sortOrder).includes(drOrd.trim()));
    return rows;
  }, [q.data, drId, drP, drO, drA, drOrd, planets.data, houses.data]);

  return (
    <div>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Row id">
            <input className={inputClass} value={drId} onChange={(e) => setDrId(e.target.value)} />
          </AdminField>
          <AdminField label="Planet (id or name)">
            <input className={inputClass} value={drP} onChange={(e) => setDrP(e.target.value)} />
          </AdminField>
          <AdminField label="Occupant house">
            <input className={inputClass} value={drO} onChange={(e) => setDrO(e.target.value)} />
          </AdminField>
          <AdminField label="Aspected house">
            <input className={inputClass} value={drA} onChange={(e) => setDrA(e.target.value)} />
          </AdminField>
          <AdminField label="Sort order contains">
            <input className={inputClass} value={drOrd} onChange={(e) => setDrOrd(e.target.value)} />
          </AdminField>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setMode("new");
                setF({ id: "", planetId: "", occupantHouseId: "", aspectedHouseId: "", sortOrder: "0" });
                setOpen(true);
              }}
              className={addBtn}
            >
              <IconPlus />
              Add
            </button>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="sticky top-0 border-b border-white/[0.07] bg-zinc-900/60">
              <th className={TH}>#</th>
              <th className={TH}>P</th>
              <th className={TH}>Occ</th>
              <th className={TH}>Asp</th>
              <th className={TH}>ord</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {!q.data && <BlockSkel cols={6} />}
            {drishtiRows.map((r) => {
              const pId = (r as { planetId: number }).planetId;
              const o = (r as { occupantHouseId: number }).occupantHouseId;
              const a = (r as { aspectedHouseId: number }).aspectedHouseId;
              return (
                <tr key={r.id as number} className="transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.id as number}</td>
                  <td className="px-4 py-3 font-medium text-zinc-100">{pName(pId)}</td>
                  <td className="px-4 py-3 text-zinc-300">{hName(o)}</td>
                  <td className="px-4 py-3 text-zinc-300">{hName(a)}</td>
                  <td className="px-4 py-3">{(r as { sortOrder: number }).sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className={btnP}
                        title="Edit"
                        onClick={() => {
                          setMode("edit");
                          setF({
                            id: String(r.id),
                            planetId: String(pId),
                            occupantHouseId: String(o),
                            aspectedHouseId: String(a),
                            sortOrder: String((r as { sortOrder: number }).sortOrder),
                          });
                          setOpen(true);
                        }}
                      >
                        <IconPencil />
                      </button>
                      <button type="button" className={btnT} title="Delete" onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}>
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableScroll>
      <Modal open={open} onClose={() => setOpen(false)} title={mode === "new" ? "New drishti" : "Edit drishti"} wide>
        <div className="space-y-2">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
            Planet
            <select
              className={selectClass }
              value={f.planetId}
              onChange={(e) => setF((x) => ({ ...x, planetId: e.target.value }))}
            >
              <option value="">—</option>
              {planets.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
            Occ house
            <select
              className={selectClass }
              value={f.occupantHouseId}
              onChange={(e) => setF((x) => ({ ...x, occupantHouseId: e.target.value }))}
            >
              <option value="">—</option>
              {houses.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
            Aspected house
            <select
              className={selectClass }
              value={f.aspectedHouseId}
              onChange={(e) => setF((x) => ({ ...x, aspectedHouseId: e.target.value }))}
            >
              <option value="">—</option>
              {houses.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
            sortOrder
            <input
              className={inputClass }
              value={f.sortOrder}
              onChange={(e) => setF((x) => ({ ...x, sortOrder: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <button type="button" className="text-sm text-zinc-500" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
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
