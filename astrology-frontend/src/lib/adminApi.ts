import axios from "axios";
import { attachAuth } from "@/lib/api";

function baseURL() {
  return typeof window !== "undefined"
    ? "/api-proxy"
    : `${process.env.INTERNAL_NEXT_ORIGIN || "http://127.0.0.1:3000"}/api-proxy`;
}

/** Admin screens share the normal session (in-memory access token + refresh cookie). */
const adminApi = attachAuth(
  axios.create({
    baseURL: baseURL(),
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    timeout: 120_000,
  }),
);

// ── Optional break-glass API key (sessionStorage only; cleared when the tab closes) ──────────
const KEY_STORAGE = "astrologyAdminKey";

export function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}
export function setAdminKey(key: string) {
  try {
    sessionStorage.setItem(KEY_STORAGE, key);
  } catch {
    /* ignore */
  }
}
export function clearAdminKey() {
  try {
    sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

adminApi.interceptors.request.use((config) => {
  const k = getAdminKey();
  if (k) config.headers.set("X-Admin-Key", k);
  return config;
});

export default adminApi;
