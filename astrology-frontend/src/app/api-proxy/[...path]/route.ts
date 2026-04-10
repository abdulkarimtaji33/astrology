import axios, { type AxiosRequestConfig } from 'axios';
import { NextRequest, NextResponse } from 'next/server';

/** 10 minutes — matches Next segment limit + client; avoids fetch/undici ~60s behavior in dev */
const TEN_MIN_MS = 10 * 60 * 1000;
const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:6000';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Seconds (Vercel / Next route execution budget); local dev also respects this in many versions */
export const maxDuration = 60000;

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-connection',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function buildTarget(req: NextRequest, pathSegments: string[]): string {
  const path = pathSegments.join('/');
  const u = new URL(req.url);
  return `${BACKEND}/${path}${u.search}`;
}

function forwardHeaders(req: NextRequest): Record<string, string> {
  const out: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) out[key] = value;
  });
  out.host = new URL(BACKEND).host;
  return out;
}

async function proxy(req: NextRequest, pathSegments: string[]): Promise<Response> {
  const dest = buildTarget(req, pathSegments);
  const method = (req.method || 'GET').toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);
  let data: Buffer | undefined;
  if (hasBody) {
    const ab = await req.arrayBuffer();
    if (ab.byteLength) data = Buffer.from(ab);
  }

  try {
    const res = await axios({
      method: method as AxiosRequestConfig['method'],
      url: dest,
      data,
      timeout: TEN_MIN_MS,
      responseType: 'arraybuffer',
      headers: forwardHeaders(req),
      validateStatus: () => true,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const headers = new Headers();
    for (const [k, v] of Object.entries(res.headers)) {
      if (v == null) continue;
      if (Array.isArray(v)) for (const x of v) headers.append(k, x);
      else headers.set(k, String(v));
    }

    return new NextResponse(res.data, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api-proxy]', dest, msg);
    return NextResponse.json(
      { error: 'Upstream proxy failed', message: msg, dest },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
