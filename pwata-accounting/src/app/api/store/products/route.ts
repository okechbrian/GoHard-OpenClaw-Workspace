import { sql } from "@/lib/db";
import { corsHeaders, handlePreflight } from "@/lib/store-cors";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)!;
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const rows = await sql`
      SELECT * FROM products
      WHERE category != 'services'
      ORDER BY category, name ASC
    ` as any[];
    const products = rows.map((p) => ({
      ...p,
      customizable: Boolean(p.customizable),
    }));
    return NextResponse.json(products, { headers });
  } catch (err) {
    console.error("products fetch failed:", err);
    const o2 = request.headers.get("origin");
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500, headers: corsHeaders(o2) });
  }
}
