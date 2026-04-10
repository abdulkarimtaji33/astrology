import type { NextConfig } from "next";

/** Long AI calls use app/api-proxy/[...path]/route.ts (no 60s rewrite limit). */
const nextConfig: NextConfig = {};

export default nextConfig;
