"use client";

import adminApi, { clearAdminKey, getAdminKey, setAdminKey } from "@/lib/adminApi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const nav: { href: string; label: string; group: string }[] = [
  { href: "/admin", label: "Overview", group: "Main" },
  { href: "/admin/birth-records", label: "Birth records", group: "Core" },
  { href: "/admin/ai-analyses", label: "AI analyses", group: "Core" },
  { href: "/admin/jyotish", label: "Jyotish data", group: "Data" },
  { href: "/admin/geo", label: "Geography", group: "Data" },
];

function cx(...a: (string | false | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [boot, setBoot] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [keyIn, setKeyIn] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const tryKey = useCallback(async (k: string) => {
    setErr(null);
    setAdminKey(k);
    try {
      await adminApi.get("/admin/health");
      setAuthed(true);
      return true;
    } catch {
      clearAdminKey();
      setAuthed(false);
      setErr("Invalid key or server unreachable.");
      return false;
    }
  }, []);

  useEffect(() => {
    const k = getAdminKey();
    if (k) {
      void (async () => {
        const ok = await tryKey(k);
        if (!ok) clearAdminKey();
        setBoot(false);
      })();
    } else {
      setBoot(false);
    }
  }, [tryKey]);

  if (boot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0c10] text-slate-500">
        Loading…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0a0c10] to-[#0e1218] px-4 text-slate-200">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-[#0f1419] p-8 shadow-2xl">
          <h1 className="text-center text-lg font-semibold text-amber-200">Admin</h1>
          <p className="mt-2 text-center text-xs text-slate-500">
            Set <code className="text-amber-200/80">ADMIN_API_KEY</code> in the API server, then use it here.
          </p>
          <input
            type="password"
            className="mt-6 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-amber-500/50"
            placeholder="API key"
            value={keyIn}
            onChange={(e) => setKeyIn(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && keyIn && void tryKey(keyIn)}
          />
          {err && <p className="mt-2 text-center text-xs text-rose-400">{err}</p>}
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-amber-400"
            onClick={() => keyIn && void tryKey(keyIn)}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080a0e] text-slate-200">
      <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-[#0c0e14] py-6 md:block">
        <div className="px-4 pb-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500/80">Jyotish</div>
          <div className="text-sm font-semibold text-amber-100">Admin</div>
        </div>
        <nav className="space-y-6 px-2">
          {["Main", "Core", "Data"].map((g) => (
            <div key={g}>
              <div className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-slate-600">{g}</div>
              {nav
                .filter((n) => n.group === g)
                .map((n) => {
                  const active =
                    n.href === "/admin" ? path === "/admin" : path.startsWith(n.href) && n.href !== "/admin";
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={cx(
                        "mb-0.5 block rounded-lg px-2.5 py-2 text-sm transition",
                        active ? "bg-amber-500/15 text-amber-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                      )}
                    >
                      {n.label}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>
        <div className="mt-8 border-t border-white/10 px-4 pt-4">
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-rose-400"
            onClick={() => {
              clearAdminKey();
              setAuthed(false);
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-h-screen flex-1 overflow-auto">
        <div className="space-y-2 border-b border-white/10 bg-[#0a0c10]/80 px-3 py-3 backdrop-blur md:hidden">
          <div className="text-sm font-medium text-amber-100">Admin</div>
          <div className="flex flex-wrap gap-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
