import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cancelled = await sql`
      SELECT id, order_number FROM orders WHERE status = 'cancelled'
    ` as Array<{ id: string; order_number: string }>;

    if (cancelled.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    const ids = cancelled.map((o) => o.id);

    await sql`UPDATE sales SET order_id = NULL WHERE order_id = ANY(${ids}::text[])`;
    await sql`UPDATE invoices SET order_id = NULL WHERE order_id = ANY(${ids}::text[])`;
    await sql`DELETE FROM orders WHERE id = ANY(${ids}::text[])`;

    console.log(`🗑️ Bulk cleared ${cancelled.length} cancelled orders by ${user.name || user.id}`);

    return NextResponse.json({ deleted: cancelled.length, orders: cancelled.map((o) => o.order_number) });
  } catch (error) {
    console.error("Bulk clear error:", error);
    return NextResponse.json({ error: "Failed to clear cancelled orders" }, { status: 500 });
  }
}
