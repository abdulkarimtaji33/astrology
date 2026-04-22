"use client";

import {
  AdminBtnPrimary,
  AdminField,
  AdminFilterGrid,
  AdminPageHeader,
  AdminPanel,
  AdminTableScroll,
  AdminToolbar,
  adminInput,
  adminTh,
  adminTr,
} from "@/components/admin/admin-ui";
import { Modal } from "@/components/admin/Modal";
import { PaginationBar } from "@/components/admin/PaginationBar";
import adminApi from "@/lib/adminApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

const TABS = [
  { key: "regions" as const, label: "Regions" },
  { key: "subregions" as const, label: "Subregions" },
  { key: "countries" as const, label: "Countries" },
  { key: "states" as const, label: "States" },
  { key: "cities" as const, label: "Cities" },
];

const inputClass = adminInput;
const selectClass = adminInput;
const TH = adminTh;
const addBtn =
  "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-md shadow-cyan-950/25 transition hover:from-cyan-400 hover:to-cyan-300";

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4.5h9M5 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M4.5 4.5l.5 8h4l.5-8" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 2.5L2 9v3h3l6.5-6.5-3-3zM6 4l3 3" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="6" cy="6" r="4.5" />
      <path d="M9 9l3.5 3.5" />
    </svg>
  );
}

type PageRes = { items: Record<string, unknown>[]; total: number; page: number; limit: number };

function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative shrink-0 whitespace-nowrap rounded-t-md px-4 py-2.5 text-sm font-medium transition",
        active
          ? "text-white after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:rounded-t-full after:bg-cyan-500"
          : "text-zinc-500 hover:text-zinc-300",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SkelTableRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, r) => (
        <tr key={r} className={r % 2 ? "bg-white/[0.015]" : ""}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="p-3">
              <div className="h-4 w-full max-w-[10rem] animate-pulse rounded bg-slate-700/30" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function GeoAdmin() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("regions");
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Geography"
        subtitle="Regions through cities with server-side filters on paginated tables and inline editing."
      />
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-white/[0.07] pb-px">
        {TABS.map((t) => (
          <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </TabBtn>
        ))}
      </div>
      <div>{tab === "regions" && <RegionsTab />}</div>
      <div>{tab === "subregions" && <SubregionsTab />}</div>
      <div>{tab === "countries" && <CountriesTab />}</div>
      <div>{tab === "states" && <StatesTab />}</div>
      <div>{tab === "cities" && <CitiesTab />}</div>
    </div>
  );
}

function RegionsTab() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "regions"],
    queryFn: () => adminApi.get<Record<string, unknown>[]>("/admin/regions").then((r) => r.data),
  });
  const c = useMutation({
    mutationFn: (b: { name: string }) => adminApi.post("/admin/regions", b),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "regions"] }),
  });
  const p = useMutation({
    mutationFn: ({ id, ...b }: { id: number; name?: string }) => adminApi.patch(`/admin/regions/${id}`, b),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "regions"] }),
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/regions/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "regions"] }),
  });
  const [name, setName] = useState("");
  const [fid, setFid] = useState("");
  const [fname, setFname] = useState("");
  const rows = useMemo(() => {
    let list = q.data ?? [];
    const idf = fid.trim();
    const nf = fname.trim().toLowerCase();
    if (idf) list = list.filter((x) => String(x.id).includes(idf));
    if (nf) list = list.filter((x) => String(x.name ?? "").toLowerCase().includes(nf));
    return list;
  }, [q.data, fid, fname]);

  return (
    <AdminPanel>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Filter id contains">
            <input className={inputClass} value={fid} onChange={(e) => setFid(e.target.value)} placeholder="e.g. 12" />
          </AdminField>
          <AdminField label="Filter name contains">
            <input className={inputClass} value={fname} onChange={(e) => setFname(e.target.value)} placeholder="Asia…" />
          </AdminField>
          <AdminField label="New region">
            <input placeholder="Name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </AdminField>
          <div className="flex items-end">
            <AdminBtnPrimary type="button" onClick={() => name && c.mutate({ name })}>
              Add region
            </AdminBtnPrimary>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className={TH}>Id</th>
              <th className={TH}>Name</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody>
            {!q.data && <SkelTableRows cols={3} />}
            {rows.map((r) => (
              <tr key={r.id as number} className={adminTr}>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{(r.id as number) ?? ""}</td>
                <td className="px-4 py-3">
                  <input
                    className={inputClass}
                    defaultValue={String(r.name ?? "")}
                    onBlur={(e) => p.mutate({ id: r.id as number, name: e.target.value })}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-500/15 hover:text-rose-400"
                    onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}
                    title="Delete"
                  >
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableScroll>
    </AdminPanel>
  );
}

function SubregionsTab() {
  const qc = useQueryClient();
  const regionsQ = useQuery({
    queryKey: ["admin", "regions"],
    queryFn: () => adminApi.get<{ id: number; name: string }[]>("/admin/regions").then((r) => r.data),
    staleTime: Infinity,
  });
  const q = useQuery({
    queryKey: ["admin", "subregions"],
    queryFn: () => adminApi.get<Record<string, unknown>[]>("/admin/subregions").then((r) => r.data),
  });
  const c = useMutation({
    mutationFn: (b: { name: string; regionId: number }) => adminApi.post("/admin/subregions", b),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "subregions"] }),
  });
  const patchM = useMutation({
    mutationFn: (b: { id: number; name?: string; regionId?: number }) => adminApi.patch(`/admin/subregions/${b.id}`, b),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "subregions"] });
      setEditOpen(false);
    },
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/subregions/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "subregions"] }),
  });
  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({ id: 0, name: "", regionId: "" });
  const [fid, setFid] = useState("");
  const [fname, setFname] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  const regionName = (id: number) => regionsQ.data?.find((x) => x.id === id)?.name ?? `#${id}`;

  const rows = useMemo(() => {
    let list = q.data ?? [];
    const idf = fid.trim();
    const nf = fname.trim().toLowerCase();
    if (idf) list = list.filter((x) => String(x.id).includes(idf));
    if (nf) list = list.filter((x) => String(x.name ?? "").toLowerCase().includes(nf));
    if (filterRegion)
      list = list.filter((x) => String((x as { regionId: number }).regionId) === filterRegion);
    return list;
  }, [q.data, fid, fname, filterRegion]);

  return (
    <AdminPanel>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Filter id contains">
            <input className={inputClass} value={fid} onChange={(e) => setFid(e.target.value)} />
          </AdminField>
          <AdminField label="Filter name contains">
            <input className={inputClass} value={fname} onChange={(e) => setFname(e.target.value)} />
          </AdminField>
          <AdminField label="Filter by region">
            <select className={selectClass} value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
              <option value="">All regions</option>
              {regionsQ.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="New name">
            <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          </AdminField>
          <AdminField label="New parent region">
            <select className={selectClass} value={regionId} onChange={(e) => setRegionId(e.target.value)}>
              <option value="">— region —</option>
              {regionsQ.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </AdminField>
          <div className="flex items-end">
            <AdminBtnPrimary type="button" onClick={() => name && regionId && c.mutate({ name, regionId: +regionId })}>
              Add subregion
            </AdminBtnPrimary>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr>
              <th className={TH}>Id</th>
              <th className={TH}>Name</th>
              <th className={TH}>Region</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody>
            {!q.data && <SkelTableRows cols={4} />}
            {rows.map((r) => {
              const rid = (r as { regionId: number }).regionId;
              return (
                <tr key={r.id as number} className={adminTr}>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.id as number}</td>
                  <td className="px-4 py-3">{String(r.name)}</td>
                  <td className="p-2 text-zinc-300">{regionName(rid)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-cyan-500/15 hover:text-cyan-300"
                        title="Edit"
                        onClick={() => {
                          setEdit({
                            id: r.id as number,
                            name: String(r.name),
                            regionId: String(rid),
                          });
                          setEditOpen(true);
                        }}
                      >
                        <IconPencil />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-500/15 hover:text-rose-400"
                        title="Delete"
                        onClick={() => window.confirm("Delete?") && d.mutate(r.id as number)}
                      >
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
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit subregion"
        wide
      >
        <div className="space-y-3">
          <label className="text-xs text-zinc-500">
            Name
            <input className={inputClass } value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <label className="text-xs text-zinc-500">
            Region
            <select
              className={selectClass }
              value={edit.regionId}
              onChange={(e) => setEdit((s) => ({ ...s, regionId: e.target.value }))}
            >
              <option value="">—</option>
              {regionsQ.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end border-t border-white/[0.07] pt-4">
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-md shadow-amber-900/20 transition hover:bg-amber-400"
            onClick={() => patchM.mutate({ id: edit.id, name: edit.name, regionId: +edit.regionId })}
          >
            Save
          </button>
        </div>
      </Modal>
    </AdminPanel>
  );
}

function CountriesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({
    id: 0,
    name: "",
    iso2: "",
    iso3: "",
    phonecode: "",
    population: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [regionId, setRegionId] = useState("");
  const [subregionId, setSubregionId] = useState("");
  const [iso2, setIso2] = useState("");

  const regionsQ = useQuery({
    queryKey: ["admin", "regions"],
    queryFn: () => adminApi.get<{ id: number; name: string }[]>("/admin/regions").then((r) => r.data),
    staleTime: Infinity,
  });
  const subregionsQ = useQuery({
    queryKey: ["admin", "subregions"],
    queryFn: () => adminApi.get<{ id: number; name: string; regionId: number }[]>("/admin/subregions").then((r) => r.data),
    staleTime: Infinity,
  });

  // debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  const q = useQuery({
    queryKey: ["admin", "countries", page, search, regionId, subregionId, iso2],
    queryFn: () =>
      adminApi
        .get<PageRes>("/admin/countries", {
          params: {
            page,
            limit: 25,
            q: search || undefined,
            regionId: regionId ? +regionId : undefined,
            subregionId: subregionId ? +subregionId : undefined,
            iso2: iso2.trim() || undefined,
          },
        })
        .then((r) => r.data),
  });
  const c = useMutation({
    mutationFn: (b: { name: string }) => adminApi.post("/admin/countries", b),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "countries"] }),
  });
  const patchM = useMutation({
    mutationFn: (b: { id: number; name: string; iso2: string; iso3: string; phonecode: string; population: string }) =>
      adminApi.patch(`/admin/countries/${b.id}`, {
        name: b.name,
        iso2: b.iso2 || undefined,
        iso3: b.iso3 || undefined,
        phonecode: b.phonecode || undefined,
        population: b.population || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "countries"] });
      setEditOpen(false);
    },
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/countries/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "countries"] }),
  });
  const [name, setName] = useState("");

  return (
    <AdminPanel>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Search name / ISO">
            <div className="relative">
              <IconSearch />
              <input
                className={inputClass + " pl-8"}
                placeholder="Name, iso2, iso3…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </AdminField>
          <AdminField label="Region">
            <select
              className={selectClass}
              value={regionId}
              onChange={(e) => {
                setRegionId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Any</option>
              {regionsQ.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Subregion">
            <select
              className={selectClass}
              value={subregionId}
              onChange={(e) => {
                setSubregionId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Any</option>
              {subregionsQ.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="ISO2 exact">
            <input className={inputClass} value={iso2} onChange={(e) => { setIso2(e.target.value); setPage(1); }} placeholder="IN" maxLength={2} />
          </AdminField>
          <AdminField label="New country name">
            <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          </AdminField>
          <div className="flex items-end">
            <AdminBtnPrimary type="button" onClick={() => name && c.mutate({ name })}>
              Add country
            </AdminBtnPrimary>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr>
              <th className={TH}>Id</th>
              <th className={TH}>Name</th>
              <th className={TH}>ISO2</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody>
            {!q.data && <SkelTableRows cols={4} />}
            {q.data?.items.map((r) => (
              <tr key={r.id as number} className={adminTr}>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.id as number}</td>
                <td className="px-4 py-3">{String(r.name)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400">
                    {String((r as { iso2?: string }).iso2 ?? "—")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-amber-500/15 hover:text-amber-400"
                      title="Edit"
                      onClick={async () => {
                        const ro = await adminApi.get<Record<string, unknown>>(`/admin/countries/${r.id as number}`).then((x) => x.data);
                        setEdit({
                          id: r.id as number,
                          name: String(ro.name ?? ""),
                          iso2: String((ro as { iso2?: string }).iso2 ?? ""),
                          iso3: String((ro as { iso3?: string }).iso3 ?? ""),
                          phonecode: String((ro as { phonecode?: string }).phonecode ?? ""),
                          population: String((ro as { population?: string }).population ?? ""),
                        });
                        setEditOpen(true);
                      }}
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-500/15 hover:text-rose-400"
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
      {q.data ? (
        <div className="border-t border-white/[0.06] p-4">
          <PaginationBar page={q.data.page} total={q.data.total} limit={q.data.limit} onPage={setPage} />
        </div>
      ) : null}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit country" wide>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["name", "iso2", "iso3", "phonecode", "population"] as const).map((k) => (
            <label key={k} className="text-xs capitalize text-zinc-500">
              {k === "phonecode" ? "Phone code" : k}
              <input
                className={inputClass }
                value={edit[k]}
                onChange={(e) => setEdit((s) => ({ ...s, [k]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end border-t border-white/[0.07] pt-4">
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-md shadow-amber-900/20 transition hover:bg-amber-400"
            onClick={() => patchM.mutate(edit)}
          >
            Save
          </button>
        </div>
      </Modal>
    </AdminPanel>
  );
}

type CountryRow = { id: number; name: string; iso2?: string | null };

function StatesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [form, setForm] = useState({ id: 0, name: "", countryId: 0, countryCode: "", iso2: "" });
  const [countryFilter, setCountryFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState("");
  const [filterCountryCode, setFilterCountryCode] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  const q = useQuery({
    queryKey: ["admin", "states", page, search, filterCountryId, filterCountryCode],
    queryFn: () =>
      adminApi
        .get<PageRes>("/admin/states", {
          params: {
            page,
            limit: 25,
            q: search || undefined,
            countryId: filterCountryId ? +filterCountryId : undefined,
            countryCode: filterCountryCode.trim() || undefined,
          },
        })
        .then((r) => r.data),
  });
  const countriesQ = useQuery({
    queryKey: ["admin", "countries", "all500"],
    queryFn: () => adminApi.get<PageRes>("/admin/countries", { params: { page: 1, limit: 500 } }).then((r) => r.data),
    staleTime: Infinity,
  });
  const createM = useMutation({
    mutationFn: (b: { name: string; countryId: number; countryCode: string; iso2?: string }) => adminApi.post("/admin/states", b),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "states"] });
      setModal(null);
    },
  });
  const patchM = useMutation({
    mutationFn: (b: { id: number; name: string; countryId: number; countryCode: string; iso2?: string }) =>
      adminApi.patch(`/admin/states/${b.id}`, b),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "states"] });
      setModal(null);
    },
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/states/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "states"] }),
  });

  const countries = (countriesQ.data?.items as CountryRow[] | undefined) ?? [];
  const filtered = useMemo(() => {
    const f = countryFilter.toLowerCase().trim();
    if (!f) return countries.slice(0, 40);
    return countries.filter((c) => c.name.toLowerCase().includes(f) || (c.iso2 ?? "").toLowerCase().includes(f)).slice(0, 50);
  }, [countries, countryFilter]);

  return (
    <AdminPanel>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Search name / codes">
            <div className="relative">
              <IconSearch />
              <input
                className={inputClass + " pl-8"}
                placeholder="State name, ISO, country code…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </AdminField>
          <AdminField label="Country id">
            <input
              className={inputClass}
              inputMode="numeric"
              value={filterCountryId}
              onChange={(e) => {
                setFilterCountryId(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. 101"
            />
          </AdminField>
          <AdminField label="Country code (ISO2)">
            <input
              className={inputClass}
              value={filterCountryCode}
              onChange={(e) => {
                setFilterCountryCode(e.target.value);
                setPage(1);
              }}
              placeholder="IN"
              maxLength={2}
            />
          </AdminField>
          <div className="flex items-end">
            <AdminBtnPrimary
              type="button"
              onClick={() => {
                setModal("new");
                setForm({ id: 0, name: "", countryId: 0, countryCode: "", iso2: "" });
                setCountryFilter("");
              }}
            >
              + New state
            </AdminBtnPrimary>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr>
              <th className={TH}>Id</th>
              <th className={TH}>Name</th>
              <th className={TH}>CC</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody>
            {!q.data && <SkelTableRows cols={4} />}
            {q.data?.items.map((r) => (
              <tr key={r.id as number} className={adminTr}>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.id as number}</td>
                <td className="px-4 py-3">{String(r.name)}</td>
                <td className="px-4 py-3">{(r as { countryCode: string }).countryCode}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-amber-500/15 hover:text-amber-400"
                      title="Edit"
                      onClick={async () => {
                        const s = await adminApi.get<Record<string, unknown>>(`/admin/states/${r.id as number}`).then((x) => x.data);
                        setForm({
                          id: r.id as number,
                          name: String(s.name ?? ""),
                          countryId: (s as { countryId: number }).countryId,
                          countryCode: String((s as { countryCode: string }).countryCode),
                          iso2: String((s as { iso2?: string | null }).iso2 ?? ""),
                        });
                        setModal("edit");
                      }}
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-500/15 hover:text-rose-400"
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
      {q.data ? (
        <div className="border-t border-white/[0.06] p-4">
          <PaginationBar page={q.data.page} total={q.data.total} limit={q.data.limit} onPage={setPage} />
        </div>
      ) : null}

      <Modal open={modal != null} onClose={() => setModal(null)} title={modal === "new" ? "New state" : "Edit state"} wide>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-zinc-500">Filter countries</p>
            <input className={inputClass } value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} placeholder="Type to search" />
            <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-white/[0.08] bg-zinc-950/80">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={[
                    "block w-full px-3 py-2 text-left text-sm transition",
                    form.countryId === c.id ? "bg-amber-500/15 text-amber-200" : "text-zinc-300 hover:bg-white/5",
                  ].join(" ")}
                  onClick={() => setForm((f) => ({ ...f, countryId: c.id, countryCode: c.iso2 ?? "" }))}
                >
                  {c.name} <span className="text-zinc-600">· {c.iso2 ?? "—"}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="text-xs text-zinc-500">
            Name
            <input className={inputClass } value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              Country id
              <input className={inputClass + " mt-1 font-mono text-xs"} readOnly value={form.countryId || "—"} />
            </label>
            <label className="text-xs text-zinc-500">
              Country code
              <input
                className={inputClass + " mt-1 font-mono text-xs"}
                value={form.countryCode}
                onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
              />
            </label>
            <label className="text-xs text-zinc-500 sm:col-span-2">
              ISO2 (state)
              <input className={inputClass } value={form.iso2} onChange={(e) => setForm((f) => ({ ...f, iso2: e.target.value }))} />
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <button type="button" className="text-sm text-zinc-500" onClick={() => setModal(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
            disabled={!form.name || !form.countryId || !form.countryCode}
            onClick={() => {
              if (modal === "new") {
                void createM.mutate({
                  name: form.name,
                  countryId: form.countryId,
                  countryCode: form.countryCode,
                  iso2: form.iso2 || undefined,
                });
              } else {
                void patchM.mutate({
                  id: form.id,
                  name: form.name,
                  countryId: form.countryId,
                  countryCode: form.countryCode,
                  iso2: form.iso2 || undefined,
                });
              }
            }}
          >
            Save
          </button>
        </div>
      </Modal>
    </AdminPanel>
  );
}

function CitiesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [qtr, setQtr] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      if (qtr !== debounced) {
        setDebounced(qtr);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [qtr, debounced]);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [countryFilter, setCountryFilter] = useState("");
  const [stateIdF, setStateIdF] = useState("");
  const [countryIdF, setCountryIdF] = useState("");
  const [timezoneQF, setTimezoneQF] = useState("");
  const [typeQF, setTypeQF] = useState("");
  const [countryCodeF, setCountryCodeF] = useState("");
  const [stateCodeF, setStateCodeF] = useState("");
  const [form, setForm] = useState({
    id: 0,
    name: "",
    stateId: "",
    stateCode: "",
    countryId: 0,
    countryCode: "",
    latitude: "",
    longitude: "",
    timezone: "",
    type: "",
  });

  const q = useQuery({
    queryKey: ["admin", "cities", page, debounced, stateIdF, countryIdF, timezoneQF, typeQF, countryCodeF, stateCodeF],
    queryFn: () =>
      adminApi
        .get<PageRes>("/admin/cities", {
          params: {
            page,
            limit: 40,
            q: debounced || undefined,
            stateId: stateIdF.trim() ? +stateIdF : undefined,
            countryId: countryIdF.trim() ? +countryIdF : undefined,
            timezoneQ: timezoneQF.trim() || undefined,
            typeQ: typeQF.trim() || undefined,
            countryCode: countryCodeF.trim() || undefined,
            stateCode: stateCodeF.trim() || undefined,
          },
        })
        .then((r) => r.data),
  });
  const countriesQ = useQuery({
    queryKey: ["admin", "countries", "all500c"],
    queryFn: () => adminApi.get<PageRes>("/admin/countries", { params: { page: 1, limit: 500 } }).then((r) => r.data),
    staleTime: Infinity,
  });
  const createM = useMutation({
    mutationFn: (b: {
      name: string;
      stateId: number;
      stateCode: string;
      countryId: number;
      countryCode: string;
      latitude: string;
      longitude: string;
      timezone?: string;
      type?: string;
    }) => adminApi.post("/admin/cities", b),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "cities"] });
      setModal(null);
    },
  });
  const patchM = useMutation({
    mutationFn: (b: {
      id: number;
      name: string;
      stateId: number;
      stateCode: string;
      countryId: number;
      countryCode: string;
      latitude: string;
      longitude: string;
      timezone?: string;
      type?: string;
    }) => adminApi.patch(`/admin/cities/${b.id}`, b),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "cities"] });
      setModal(null);
    },
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/cities/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "cities"] }),
  });

  const countries = (countriesQ.data?.items as CountryRow[] | undefined) ?? [];
  const filtered = useMemo(() => {
    const f = countryFilter.toLowerCase().trim();
    if (!f) return countries.slice(0, 40);
    return countries.filter((c) => c.name.toLowerCase().includes(f) || (c.iso2 ?? "").toLowerCase().includes(f)).slice(0, 50);
  }, [countries, countryFilter]);

  return (
    <AdminPanel>
      <AdminToolbar>
        <AdminFilterGrid>
          <AdminField label="Search (name, codes, id)">
            <div className="relative">
              <IconSearch />
              <input
                className={inputClass + " pl-8"}
                value={qtr}
                onChange={(e) => setQtr(e.target.value)}
                placeholder="City, country/state code, id…"
              />
            </div>
          </AdminField>
          <AdminField label="State id">
            <input className={inputClass} inputMode="numeric" value={stateIdF} onChange={(e) => { setStateIdF(e.target.value); setPage(1); }} />
          </AdminField>
          <AdminField label="Country id">
            <input className={inputClass} inputMode="numeric" value={countryIdF} onChange={(e) => { setCountryIdF(e.target.value); setPage(1); }} />
          </AdminField>
          <AdminField label="Country code">
            <input className={inputClass} value={countryCodeF} onChange={(e) => { setCountryCodeF(e.target.value); setPage(1); }} placeholder="IN" maxLength={2} />
          </AdminField>
          <AdminField label="State code contains">
            <input className={inputClass} value={stateCodeF} onChange={(e) => { setStateCodeF(e.target.value); setPage(1); }} />
          </AdminField>
          <AdminField label="Timezone contains">
            <input className={inputClass} value={timezoneQF} onChange={(e) => { setTimezoneQF(e.target.value); setPage(1); }} />
          </AdminField>
          <AdminField label="Place type contains">
            <input className={inputClass} value={typeQF} onChange={(e) => { setTypeQF(e.target.value); setPage(1); }} />
          </AdminField>
          <div className="flex items-end">
            <AdminBtnPrimary
              type="button"
              onClick={() => {
                setModal("new");
                setForm({
                  id: 0,
                  name: "",
                  stateId: "",
                  stateCode: "",
                  countryId: 0,
                  countryCode: "",
                  latitude: "",
                  longitude: "",
                  timezone: "",
                  type: "",
                });
                setCountryFilter("");
              }}
            >
              + New city
            </AdminBtnPrimary>
          </div>
        </AdminFilterGrid>
      </AdminToolbar>
      <AdminTableScroll>
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr>
              <th className={TH}>Id</th>
              <th className={TH}>Name</th>
              <th className={TH}>CC</th>
              <th className={`${TH} text-right`}>•</th>
            </tr>
          </thead>
          <tbody>
            {!q.data && <SkelTableRows cols={4} />}
            {q.data?.items.map((r) => (
              <tr key={r.id as number} className={adminTr}>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.id as number}</td>
                <td className="px-4 py-3">{String(r.name)}</td>
                <td className="px-4 py-3">{(r as { countryCode: string }).countryCode}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-amber-500/15 hover:text-amber-400"
                      title="Edit"
                      onClick={async () => {
                        const c = await adminApi.get<Record<string, unknown>>(`/admin/cities/${r.id as number}`).then((x) => x.data);
                        setForm({
                          id: r.id as number,
                          name: String(c.name ?? ""),
                          stateId: String((c as { stateId: number }).stateId),
                          stateCode: String((c as { stateCode: string }).stateCode),
                          countryId: (c as { countryId: number }).countryId,
                          countryCode: String((c as { countryCode: string }).countryCode),
                          latitude: String((c as { latitude: string }).latitude),
                          longitude: String((c as { longitude: string }).longitude),
                          timezone: String((c as { timezone?: string | null }).timezone ?? ""),
                          type: String((c as { type?: string | null }).type ?? ""),
                        });
                        setModal("edit");
                      }}
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-500/15 hover:text-rose-400"
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
      {q.data ? (
        <div className="border-t border-white/[0.06] p-4">
          <PaginationBar page={q.data.page} total={q.data.total} limit={q.data.limit} onPage={setPage} />
        </div>
      ) : null}

      <Modal open={modal != null} onClose={() => setModal(null)} title={modal === "new" ? "New city" : "Edit city"} wide>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-zinc-500">Select country (sets countryId &amp; code)</p>
            <input className={inputClass } value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} placeholder="Filter countries" />
            <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-white/[0.08] bg-zinc-950/80">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={[
                    "block w-full px-3 py-2 text-left text-sm transition",
                    form.countryId === c.id ? "bg-amber-500/15 text-amber-200" : "text-zinc-300 hover:bg-white/5",
                  ].join(" ")}
                  onClick={() => setForm((f) => ({ ...f, countryId: c.id, countryCode: c.iso2 ?? "" }))}
                >
                  {c.name} · {c.iso2 ?? "—"}
                </button>
              ))}
            </div>
          </div>
          <label className="text-xs text-zinc-500">
            Name
            <input className={inputClass } value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              State id
              <input
                className={inputClass + " mt-1 font-mono"}
                value={form.stateId}
                onChange={(e) => setForm((f) => ({ ...f, stateId: e.target.value }))}
              />
            </label>
            <label className="text-xs text-zinc-500">
              State code
              <input
                className={inputClass + " mt-1 font-mono"}
                value={form.stateCode}
                onChange={(e) => setForm((f) => ({ ...f, stateCode: e.target.value }))}
              />
            </label>
            <label className="text-xs text-zinc-500">
              Country id
              <input className={inputClass + " mt-1 font-mono"} readOnly value={form.countryId || "—"} />
            </label>
            <label className="text-xs text-zinc-500">
              Country code
              <input
                className={inputClass + " mt-1 font-mono"}
                value={form.countryCode}
                onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
              />
            </label>
            <label className="text-xs text-zinc-500">
              Latitude
              <input
                className={inputClass }
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
              />
            </label>
            <label className="text-xs text-zinc-500">
              Longitude
              <input
                className={inputClass }
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
              />
            </label>
            <label className="text-xs text-zinc-500 sm:col-span-2">
              Timezone
              <input
                className={inputClass }
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              />
            </label>
            <label className="text-xs text-zinc-500 sm:col-span-2">
              Type
              <input className={inputClass } value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <button type="button" className="text-sm text-zinc-500" onClick={() => setModal(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
            disabled={
              !form.name ||
              !form.stateId ||
              !form.stateCode ||
              !form.countryId ||
              !form.countryCode ||
              !form.latitude ||
              !form.longitude
            }
            onClick={() => {
              const payload = {
                name: form.name,
                stateId: +form.stateId,
                stateCode: form.stateCode,
                countryId: form.countryId,
                countryCode: form.countryCode,
                latitude: form.latitude,
                longitude: form.longitude,
                timezone: form.timezone || undefined,
                type: form.type || undefined,
              };
              if (modal === "new") {
                void createM.mutate(payload);
              } else {
                void patchM.mutate({ id: form.id, ...payload });
              }
            }}
          >
            Save
          </button>
        </div>
      </Modal>
    </AdminPanel>
  );
}
