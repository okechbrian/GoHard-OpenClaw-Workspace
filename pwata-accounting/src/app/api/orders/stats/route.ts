import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const byStatus = await sql`
      SELECT status, COUNT(*)::int AS count
      FROM orders
      WHERE status NOT IN ('completed', 'cancelled')
      GROUP BY status
    ` as Array<{ status: string; count: number }>;

    const statusMap: Record<string, number> = {};
    for (const row of byStatus) statusMap[row.status] = row.count;
    const totalActive = byStatus.reduce((s, r) => s + r.count, 0);

    const storeNew = (await sql`
      SELECT COUNT(*)::int AS count FROM orders
      WHERE source = 'store' AND status = 'in_design'
        AND payment_status IN ('partial', 'paid')
    ` as Array<{ count: number }>)[0];

    const createdToday = (await sql`
      SELECT COUNT(*)::int AS count FROM orders
      WHERE created_at::date = CURRENT_DATE
    ` as Array<{ count: number }>)[0];

    const completedToday = (await sql`
      SELECT COUNT(*)::int AS count FROM orders
      WHERE status = 'completed' AND updated_at::date = CURRENT_DATE
    ` as Array<{ count: number }>)[0];

    return NextResponse.json({
      pending: statusMap["pending"] ?? 0,
      in_design: statusMap["in_design"] ?? 0,
      printing: statusMap["printing"] ?? 0,
      ready_for_delivery: statusMap["ready_for_delivery"] ?? 0,
      totalActive,
      storeNewOrders: storeNew?.count ?? 0,
      createdToday: createdToday?.count ?? 0,
      completedToday: completedToday?.count ?? 0,
    });
  } catch (error) {
    console.error("Failed to fetch order stats:", error);
    return NextResponse.json({ error: "Failed to fetch order stats" }, { status: 500 });
  }
}
