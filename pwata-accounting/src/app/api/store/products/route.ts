import sqlite from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = sqlite.prepare("SELECT * FROM products ORDER BY category, name ASC").all() as any[];
    const products = rows.map((p) => ({
      ...p,
      variants: p.variants ? (() => { try { return JSON.parse(p.variants); } catch { return null; } })() : null,
      customizable: Boolean(p.customizable),
    }));
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
