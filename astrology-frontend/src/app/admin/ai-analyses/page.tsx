"use client";

import { Modal } from "@/components/admin/Modal";
import { PaginationBar } from "@/components/admin/PaginationBar";
import adminApi from "@/lib/adminApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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

export default function AiAnalysesAdmin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<Row | null>(null);
  const q = useQuery({
    queryKey: ["admin", "ai", page],
    queryFn: () => adminApi.get<ListRes>("/admin/ai-analyses", { params: { page, limit: 15 } }).then((r) => r.data),
  });
  const d = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admin/ai-analyses/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "ai"] }),
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-amber-50">AI analyses</h1>
      <p className="text-sm text-slate-500">Cached LLM output linked to birth records.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
              <th className="p-2">#</th>
              <th className="p-2">Chart</th>
              <th className="p-2">Model</th>
              <th className="p-2">When</th>
              <th className="p-2 text-right">•</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.items.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs text-amber-200/80">{r.id}</td>
                <td className="p-2 font-mono text-xs">{r.birthRecordId}</td>
                <td className="p-2 text-slate-400">{r.model}</td>
                <td className="p-2 text-xs text-slate-500">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="p-2 text-right text-xs">
                  <button type="button" className="text-amber-400/90" onClick={() => setView(r)}>
                    Open
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-rose-400/80"
                    onClick={() => window.confirm("Delete?") && d.mutate(r.id)}
                  >
                    Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {q.data && (
        <div className="mt-4">
          <PaginationBar page={q.data.page} total={q.data.total} limit={q.data.limit} onPage={setPage} />
        </div>
      )}

      <Modal open={view != null} onClose={() => setView(null)} title="Analysis" wide>
        {view && (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto text-xs">
            <div className="text-slate-500">
              {view.transitFrom} → {view.transitTo} · {view.basis} · {view.model}
            </div>
            <div>
              <div className="text-slate-500">Prompt</div>
              <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-2 text-slate-300">{view.prompt}</pre>
            </div>
            <div>
              <div className="text-slate-500">Response</div>
              <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-2 text-slate-200">{view.response}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
