"use client";

import adminApi, { clearAdminKey, getAdminKey, setAdminKey } from "@/lib/adminApi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

/* ─── Nav config ─────────────────────────────────────────────────────────── */

const NAV = [
  { href: "/admin",              label: "Dashboard",     icon: IcoDash,    group: "main" },
  { href: "/admin/birth-records",label: "Birth records", icon: IcoUsers,   group: "core" },
  { href: "/admin/ai-analyses",  label: "AI analyses",   icon: IcoSpark,   group: "core" },
  { href: "/admin/jyotish",      label: "Jyotish data",  icon: IcoStar,    group: "data" },
  { href: "/admin/geo",          label: "Geography",     icon: IcoGlobe,   group: "data" },
] as const;

const GROUPS: { key: string; label: string }[] = [
  { key: "main", label: "Overview" },
  { key: "core", label: "Core" },
  { key: "data", label: "Reference data" },
];

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function IcoBrand({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M16.9 16.9l1.4 1.4M5.6 18.4l1.4-1.4M16.9 7.1l1.4-1.4" />
    </svg>
  );
}
function IcoDash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}
function IcoUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 14v-1a5 5 0 0 1 10 0v1" />
      <path d="M11 4a2.5 2.5 0 1 1 0 5" />
      <path d="M15 14a5 5 0 0 0-4-4.9" />
    </svg>
  );
}
function IcoSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.2 3.2l2.1 2.1M10.7 10.7l2.1 2.1M3.2 12.8l2.1-2.1M10.7 5.3l2.1-2.1" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}
function IcoStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 1v7l3.5 3.5" />
      <path d="M8 8L4.5 4.5" />
      <path d="M8 8h-7" />
    </svg>
  );
}
function IcoGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="8" cy="8" r="7" />
      <path d="M1 8h14M8 1c-2 2-3 4.5-3 7s1 5 3 7M8 1c2 2 3 4.5 3 7s-1 5-3 7" />
    </svg>
  );
}
function IcoSignOut({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3" />
      <path d="M11 11l3-3-3-3M14 8H6" />
    </svg>
  );
}
function IcoMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  );
}
function IcoX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

function cx(...a: (string | false | undefined | null)[]) {
  return a.filter(Boolean).join(" ");
}

/* ─── Sidebar nav link ───────────────────────────────────────────────────── */

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: (p: { className?: string }) => ReactElement;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-white/[0.08] text-white"
          : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100",
      )}
    >
      <span
        className={cx(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
          active ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-950/40" : "text-zinc-500 group-hover:text-zinc-300",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      {label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />}
    </Link>
  );
}

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */

function Sidebar({
  path,
  onSignOut,
  onNav,
}: {
  path: string;
  onSignOut: () => void;
  onNav?: () => void;
}) {
  function isActive(href: string) {
    return href === "/admin" ? path === "/admin" : path.startsWith(href);
  }

  const currentLabel = NAV.find((n) => isActive(n.href))?.label ?? "Admin";

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-950/40">
          <IcoBrand className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-500">Jyotish</p>
          <p className="text-xs font-medium text-zinc-400">Control center</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {GROUPS.map((g) => {
          const items = NAV.filter((n) => n.group === g.key);
          return (
            <div key={g.key} className="mb-5">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                {g.label}
              </p>
              <div className="space-y-0.5">
                {items.map((n) => (
                  <NavLink
                    key={n.href}
                    href={n.href}
                    label={n.label}
                    icon={n.icon}
                    active={isActive(n.href)}
                    onClick={onNav}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mx-4 h-px bg-white/[0.06]" />
      <div className="px-2 py-3">
        <div className="mb-1 flex items-center gap-2 px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <p className="text-[11px] text-zinc-500">{currentLabel}</p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-600">
            <IcoSignOut className="h-3.5 w-3.5" />
          </span>
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ─── Top bar (mobile) ────────────────────────────────────────────────────── */

function TopBar({
  path,
  onMenuToggle,
  menuOpen,
}: {
  path: string;
  onMenuToggle: () => void;
  menuOpen: boolean;
}) {
  const currentLabel = NAV.find((n) =>
    n.href === "/admin" ? path === "/admin" : path.startsWith(n.href),
  )?.label ?? "Admin";

  return (
    <div className="flex h-14 items-center gap-3 border-b border-white/[0.06] bg-zinc-950/80 px-4 backdrop-blur-md">
      <button
        type="button"
        onClick={onMenuToggle}
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
      >
        {menuOpen ? <IcoX className="h-4 w-4" /> : <IcoMenu className="h-4 w-4" />}
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-cyan-500 text-zinc-950">
          <IcoBrand className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-medium text-zinc-200">{currentLabel}</span>
      </div>
    </div>
  );
}

/* ─── Loading screen ──────────────────────────────────────────────────────── */

function LoadingScreen() {
  return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 text-zinc-950 shadow-xl shadow-cyan-950/30">
        <IcoBrand className="h-6 w-6" />
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Login screen ────────────────────────────────────────────────────────── */

function LoginScreen({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (k: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const [key, setKey] = useState("");

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.05] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500 text-zinc-950 shadow-2xl shadow-cyan-950/40">
            <IcoBrand className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-white">Jyotish Admin</h1>
            <p className="mt-1 text-sm text-zinc-500">Enter your API key to continue</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-zinc-900 p-6 shadow-2xl">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-zinc-400">API Key</span>
            <input
              type="password"
              autoFocus
              placeholder="••••••••••••••••"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && key && !loading && onSubmit(key)}
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
          </label>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="7" />
                <path d="M8 5v3.5M8 11v.5" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={!key || loading}
            onClick={() => onSubmit(key)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-800 border-t-transparent" />
                Verifying…
              </>
            ) : (
              "Unlock admin"
            )}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-600">
          Set <code className="text-zinc-500">ADMIN_API_KEY</code> on the API server
        </p>
      </div>
    </div>
  );
}

/* ─── Main layout ─────────────────────────────────────────────────────────── */

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [boot, setBoot] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tryKey = useCallback(async (k: string) => {
    setAuthError(null);
    setAuthLoading(true);
    setAdminKey(k);
    try {
      await adminApi.get("/admin/health");
      setAuthed(true);
      setAuthLoading(false);
      return true;
    } catch {
      clearAdminKey();
      setAuthed(false);
      setAuthLoading(false);
      setAuthError("Invalid key or server unreachable.");
      return false;
    }
  }, []);

  useEffect(() => {
    const k = getAdminKey();
    if (k) {
      void tryKey(k).then(() => setBoot(false));
    } else {
      setBoot(false);
    }
  }, [tryKey]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  function signOut() {
    clearAdminKey();
    setAuthed(false);
  }

  if (boot) return <LoadingScreen />;
  if (!authed) return <LoginScreen onSubmit={tryKey} loading={authLoading} error={authError} />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-zinc-100">

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 border-r border-white/[0.06] lg:block">
        <Sidebar path={path} onSignOut={signOut} />
      </aside>

      {/* ── Mobile drawer overlay ────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-white/[0.06] bg-zinc-950 transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar path={path} onSignOut={signOut} onNav={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main content area ────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="shrink-0 lg:hidden">
          <TopBar path={path} onMenuToggle={() => setMobileOpen((o) => !o)} menuOpen={mobileOpen} />
        </header>

        {/* Page content */}
        <main className="relative flex-1 overflow-y-auto">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
