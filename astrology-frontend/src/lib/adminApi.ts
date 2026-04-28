import axios from "axios";

function baseURL() {
  return typeof window !== "undefined"
    ? "/api-proxy"
    : `${process.env.INTERNAL_NEXT_ORIGIN || "http://127.0.0.1:3000"}/api-proxy`;
}

const adminApi = axios.create({
  baseURL: baseURL(),
  headers: { "Content-Type": "application/json" },
  timeout: 120_000,
});

const KEY_STORAGE   = "astrologyAdminKey";
const TOKEN_STORAGE = "astrologyAdminJwt";

// ── API key (legacy) ──────────────────────────────────────────────────────
export function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY_STORAGE) ?? "";
}
export function setAdminKey(key: string) {
  localStorage.setItem(KEY_STORAGE, key);
}
export function clearAdminKey() {
  localStorage.removeItem(KEY_STORAGE);
  localStorage.removeItem(TOKEN_STORAGE);
}

// ── JWT (email/password admin) ────────────────────────────────────────────
export function getAdminJwt(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_STORAGE) ?? "";
}
export function setAdminJwt(token: string) {
  localStorage.setItem(TOKEN_STORAGE, token);
}

// ── Request interceptor ───────────────────────────────────────────────────
adminApi.interceptors.request.use((config) => {
  const jwt = getAdminJwt();
  if (jwt) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${jwt}`;
    return config;
  }
  const k = getAdminKey();
  if (k) {
    (config.headers as Record<string, string>)["X-Admin-Key"] = k;
  }
  return config;
});

export default adminApi;
