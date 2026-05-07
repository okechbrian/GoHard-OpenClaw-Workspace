import sqlite from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const byStatus = sqlite.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE status NOT IN ('completed', 'cancelled')
      GROUP BY status
    `).all() as { status: string; count: number }[];

    const statusMap: Record<string, number> = {};
    for (const row of byStatus) statusMap[row.status] = row.count;

    const totalActive = byStatus.reduce((s, r) => s + r.count, 0);

    const storeNew = sqlite.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE source = 'store' AND status = 'in_design'
        AND payment_status IN ('partial', 'paid')
    `).get() as { count: number };

    const createdToday = sqlite.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE date(created_at) = date('now')
    `).get() as { count: number };

    const completedToday = sqlite.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE status = 'completed' AND date(updated_at) = date('now')
    `).get() as { count: number };

    return NextResponse.json({
      pending: statusMap["pending"] ?? 0,
      in_design: statusMap["in_design"] ?? 0,
      printing: statusMap["printing"] ?? 0,
      ready_for_delivery: statusMap["ready_for_delivery"] ?? 0,
      totalActive,
      storeNewOrders: storeNew.count,
      createdToday: createdToday.count,
      completedToday: completedToday.count,
    });
  } catch (error) {
    console.error("Failed to fetch order stats:", error);
    return NextResponse.json({ error: "Failed to fetch order stats" }, { status: 500 });
  }
}
