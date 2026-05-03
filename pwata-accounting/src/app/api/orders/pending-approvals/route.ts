import sqlite from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const row = sqlite.prepare(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE source = 'store'
        AND status = 'in_design'
        AND payment_status IN ('partial','paid')
    `).get() as { count: number };
    return NextResponse.json({ count: row?.count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
