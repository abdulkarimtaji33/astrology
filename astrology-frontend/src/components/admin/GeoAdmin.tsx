"use client";

import { PaginationBar } from "@/components/admin/PaginationBar";
import adminApi from "@/lib/adminApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const TABS = [
  { key: "regions", label: "Regions" },
  { key: "subregions", label: "Subregions" },
  { key: "countries", label: "Countries" },
  { key: "states", label: "States" },
  { key: "cities", label: "Cities" },
] as const;

export function GeoAdmin() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("regions");
  return (
    <div>
      <h1 className="text-xl font-semibold text-amber-50">Geography</h1>
      <p className="mt-1 text-sm text-slate-500">Reference regions, countries, states, and cities.</p>
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
        {tab === "regions" && <RegionsTab />}
        {tab === "subregions" && <SubregionsTab />}
        {tab === "countries" && <CountriesTab />}
        {tab === "states" && <StatesTab />}
        {tab === "cities" && <CitiesTab />}
      </div>
    </div>
  );
}

function RegionsTab() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "regions"],
    queryFn: () => adminApi.get("/admin/regions").then((r) => r.data as Record<string, unknown>[]),
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

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          placeholder="New region name"
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-slate-950"
          onClick={() => name && c.mutate({ name })}
        >
          Add
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">Id</th>
              <th className="p-2">Name</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((r) => (
              <tr key={r.id as number} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2">
                  <input
                    className="w-full rounded border border-white/10 bg-black/20 px-2 py-1 text-sm"
                    defaultValue={String(r.name)}
                    onBlur={(e) => p.mutate({ id: r.id as number, name: e.target.value })}
                  />
                </td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    className="text-rose-400/80"
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
    </div>
  );
}

function SubregionsTab() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "subregions"],
    queryFn: () => adminApi.get("/admin/subregions").then((r) => r.data as Record<string, unknown>[]),
  });
  const c = useMutation({
    mutationFn: (b: { name: string; regionId: number }) => adminApi.post("/admin/subregions", b),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "subregions"] }),
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/subregions/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "subregions"] }),
  });
  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-24 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm"
          placeholder="region id"
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
        />
        <button
          type="button"
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-slate-950"
          onClick={() => name && regionId && c.mutate({ name, regionId: +regionId })}
        >
          Add
        </button>
      </div>
      <div className="max-h-[55vh] overflow-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">Id</th>
              <th className="p-2">Name</th>
              <th className="p-2">Region</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((r) => (
              <tr key={r.id as number} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2">{String(r.name)}</td>
                <td className="p-2">{(r as { regionId: number }).regionId}</td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    className="text-rose-400/80"
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
    </div>
  );
}

type PageRes = { items: Record<string, unknown>[]; total: number; page: number; limit: number };

function CountriesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["admin", "countries", page],
    queryFn: () => adminApi.get<PageRes>("/admin/countries", { params: { page, limit: 25 } }).then((r) => r.data),
  });
  const c = useMutation({
    mutationFn: (b: { name: string }) => adminApi.post("/admin/countries", b),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "countries"] }),
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/countries/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "countries"] }),
  });
  const [name, setName] = useState("");

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm"
          placeholder="New country name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs text-slate-950"
          onClick={() => name && c.mutate({ name })}
        >
          Add
        </button>
      </div>
      <div className="max-h-[50vh] overflow-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">Id</th>
              <th className="p-2">Name</th>
              <th className="p-2">ISO2</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.items.map((r) => (
              <tr key={r.id as number} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2">{String(r.name)}</td>
                <td className="p-2 text-slate-500">{String((r as { iso2?: string }).iso2 ?? "—")}</td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    className="text-rose-400/80"
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
      {q.data && <div className="mt-2"><PaginationBar page={q.data.page} total={q.data.total} limit={q.data.limit} onPage={setPage} /></div>}
    </div>
  );
}

function StatesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["admin", "states", page],
    queryFn: () => adminApi.get<PageRes>("/admin/states", { params: { page, limit: 25 } }).then((r) => r.data),
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/states/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "states"] }),
  });

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">Large table — browse and delete. Create via import or API for bulk rows.</p>
      <div className="max-h-[55vh] overflow-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">Id</th>
              <th className="p-2">Name</th>
              <th className="p-2">CC</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.items.map((r) => (
              <tr key={r.id as number} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2">{String(r.name)}</td>
                <td className="p-2">{(r as { countryCode: string }).countryCode}</td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    className="text-rose-400/80"
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
      {q.data && <div className="mt-2"><PaginationBar page={q.data.page} total={q.data.total} limit={q.data.limit} onPage={setPage} /></div>}
    </div>
  );
}

function CitiesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [qtr, setQtr] = useState("");
  const [debounced, setDebounced] = useState("");
  const q = useQuery({
    queryKey: ["admin", "cities", page, debounced],
    queryFn: () =>
      adminApi
        .get<PageRes>("/admin/cities", { params: { page, limit: 40, q: debounced || undefined } })
        .then((r) => r.data),
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/cities/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "cities"] }),
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-500">
          Search (2+ letters)
          <input
            className="mt-0.5 block rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm"
            value={qtr}
            onChange={(e) => {
              setQtr(e.target.value);
              window.clearTimeout((window as { _c?: number })._c);
              (window as { _c?: number })._c = window.setTimeout(
                () => setDebounced(e.target.value),
                400,
              ) as unknown as number;
            }}
            onKeyDown={(e) => e.key === "Enter" && setDebounced(qtr)}
          />
        </label>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300"
          onClick={() => setDebounced(qtr)}
        >
          Search
        </button>
      </div>
      <div className="max-h-[55vh] overflow-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">Id</th>
              <th className="p-2">Name</th>
              <th className="p-2">CC</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.items.map((r) => (
              <tr key={r.id as number} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{r.id as number}</td>
                <td className="p-2">{String(r.name)}</td>
                <td className="p-2">{(r as { countryCode: string }).countryCode}</td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    className="text-rose-400/80"
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
      {q.data && <div className="mt-2"><PaginationBar page={q.data.page} total={q.data.total} limit={q.data.limit} onPage={setPage} /></div>}
    </div>
  );
}
