import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await sql`
      SELECT COUNT(*)::int AS count
      FROM orders
      WHERE source = 'store'
        AND status = 'in_design'
        AND payment_status IN ('partial','paid')
    ` as Array<{ count: number }>;
    return NextResponse.json({ count: rows[0]?.count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
