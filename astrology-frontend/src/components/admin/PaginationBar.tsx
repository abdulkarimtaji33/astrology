"use client";

export function PaginationBar({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
      <span>
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-slate-300 transition hover:border-amber-500/40 disabled:opacity-30"
        >
          Prev
        </button>
        <span className="px-2 text-slate-500">
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-slate-300 transition hover:border-amber-500/40 disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
