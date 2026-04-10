import axios from 'axios';

const baseURL =
  typeof window !== "undefined"
    ? "/api-proxy"
    : `${process.env.INTERNAL_NEXT_ORIGIN || "http://127.0.0.1:3000"}/api-proxy`;

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  /** Browser → Next proxy → Nest; AI routes need up to 10 minutes */
  timeout: 10 * 60 * 1000,
});

export default api;
