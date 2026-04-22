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

const STORAGE = "astrologyAdminKey";

export function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE) ?? "";
}

export function setAdminKey(key: string) {
  localStorage.setItem(STORAGE, key);
}

export function clearAdminKey() {
  localStorage.removeItem(STORAGE);
}

adminApi.interceptors.request.use((config) => {
  const k = getAdminKey();
  if (k) {
    (config.headers as { "X-Admin-Key"?: string })["X-Admin-Key"] = k;
  }
  return config;
});

export default adminApi;
