import sqlite from "@/lib/db";
import { corsHeaders, handlePreflight } from "@/lib/store-cors";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)!;
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const rows = sqlite.prepare(
      "SELECT * FROM products WHERE category != 'services' ORDER BY category, name ASC"
    ).all() as any[];
    const products = rows.map((p) => ({
      ...p,
      variants: p.variants ? (() => { try { return JSON.parse(p.variants); } catch { return null; } })() : null,
      customizable: Boolean(p.customizable),
    }));
    return NextResponse.json(products, { headers });
  } catch {
    const o2 = request.headers.get("origin");
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500, headers: corsHeaders(o2) });
  }
}
