import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.ORDERS_APP_URL ?? "",
  "http://localhost:3001",
].filter(Boolean);

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] ?? "");
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Orders-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

export function handlePreflight(request: NextRequest): NextResponse | null {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }
  return null;
}

export function checkApiKey(request: NextRequest): boolean {
  const expected = process.env.ORDERS_APP_API_KEY;
  if (!expected) return false;
  return request.headers.get("X-Orders-API-Key") === expected;
}
