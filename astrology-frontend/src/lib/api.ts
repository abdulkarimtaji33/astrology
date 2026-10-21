import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, hasSessionHint, refreshSession } from '@/lib/auth-session';

const baseURL =
  typeof window !== "undefined"
    ? "/api-proxy"
    : `${process.env.INTERNAL_NEXT_ORIGIN || "http://127.0.0.1:3000"}/api-proxy`;

const AUTH_PATHS = /\/auth\/(login|register|refresh|logout|forgot-password|reset-password)/;

type Retryable = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * Adds the in-memory access token to every request and, on a 401, transparently refreshes the
 * session once and replays the request — so a short-lived access token is invisible to users.
 */
export function attachAuth(instance: AxiosInstance): AxiosInstance {
  instance.interceptors.request.use(config => {
    const t = getAccessToken();
    if (t && !config.headers.has('Authorization')) config.headers.set('Authorization', `Bearer ${t}`);
    return config;
  });

  instance.interceptors.response.use(
    r => r,
    async error => {
      const cfg = error?.config as Retryable | undefined;
      if (
        error?.response?.status === 401 &&
        cfg &&
        !cfg._retried &&
        !AUTH_PATHS.test(cfg.url ?? '') &&
        (getAccessToken() || hasSessionHint())
      ) {
        cfg._retried = true;
        const s = await refreshSession();
        if (s) {
          cfg.headers.set('Authorization', `Bearer ${s.accessToken}`);
          return instance(cfg);
        }
      }
      return Promise.reject(error);
    },
  );
  return instance;
}

const api = attachAuth(
  axios.create({
    baseURL,
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    /** Browser → Next proxy → Nest; AI routes need up to 10 minutes */
    timeout: 10 * 60 * 1000,
  }),
);

export default api;
