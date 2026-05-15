import { sql } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get("low_stock") === "true";
    const items = lowStock
      ? await sql`SELECT * FROM inventory WHERE quantity <= 5 ORDER BY name`
      : await sql`SELECT * FROM inventory ORDER BY name`;
    return NextResponse.json(items);
  } catch (error) {
    console.error("inventory fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = generateId();
    await sql`
      INSERT INTO inventory (id, name, description, category, quantity, unit, cost_price, selling_price)
      VALUES (${id}, ${body.name}, ${body.description || null}, ${body.category || null},
              ${body.quantity || 0}, ${body.unit || "pcs"}, ${body.cost_price || 0}, ${body.selling_price || 0})
    `;
    const rows = await sql`SELECT * FROM inventory WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("inventory create failed:", error);
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
  }
}
