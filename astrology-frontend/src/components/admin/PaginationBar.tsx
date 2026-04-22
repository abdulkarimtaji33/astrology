"use client";

import { useState } from "react";

function IcoChevL() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3.5L5 7l4 3.5" />
    </svg>
  );
}
function IcoChevR() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3.5L9 7l-4 3.5" />
    </svg>
  );
}
function IcoFirst() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 3v8M11 3.5L7 7l4 3.5" />
    </svg>
  );
}
function IcoLast() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 3v8M3 3.5L7 7l-4 3.5" />
    </svg>
  );
}

const btnCls =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-zinc-500 transition hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-30";

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
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const [jump, setJump] = useState("");

  function handleJump(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const n = parseInt(jump, 10);
    if (!isNaN(n) && n >= 1 && n <= pages) onPage(n);
    setJump("");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
      {/* Count */}
      <p className="text-zinc-600">
        <span className="font-medium text-zinc-300">{from.toLocaleString()}</span>
        {" – "}
        <span className="font-medium text-zinc-300">{to.toLocaleString()}</span>
        {" of "}
        <span className="font-medium text-zinc-300">{total.toLocaleString()}</span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPage(1)} className={btnCls} title="First page">
          <IcoFirst />
        </button>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={btnCls} title="Previous">
          <IcoChevL />
        </button>

        {pages > 3 ? (
          <input
            type="number"
            min={1}
            max={pages}
            placeholder={`${page} / ${pages}`}
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={handleJump}
            title="Type page & press Enter"
            className="h-8 w-20 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-2 text-center text-xs font-medium text-amber-200 placeholder:text-amber-200/40 outline-none focus:border-amber-500/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        ) : (
          <div className="flex h-8 min-w-[4.5rem] items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 font-medium text-amber-200">
            {page} / {pages}
          </div>
        )}

        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className={btnCls} title="Next">
          <IcoChevR />
        </button>
        <button type="button" disabled={page >= pages} onClick={() => onPage(pages)} className={btnCls} title="Last page">
          <IcoLast />
        </button>
      </div>
    </div>
  );
}
