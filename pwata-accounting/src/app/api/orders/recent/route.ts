import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await sql`
      SELECT o.id, o.order_number, o.status, o.payment_status, o.total_amount,
             o.source, o.created_at,
             COALESCE(c.name, o.guest_name, o.guest_phone, 'Unknown') AS customer
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch recent orders:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
