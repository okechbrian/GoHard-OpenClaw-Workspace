import sqlite from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get("low_stock");

    let query = `SELECT * FROM inventory WHERE 1=1`;
    if (lowStock === "true") {
      query += ` AND quantity <= 5`;
    }
    query += ` ORDER BY name`;
    const items = sqlite.prepare(query).all();
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = generateId();

    sqlite.prepare(`
      INSERT INTO inventory (id, name, description, category, quantity, unit, cost_price, selling_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, body.name, body.description || null, body.category || null, body.quantity || 0, body.unit || "pcs", body.cost_price || 0, body.selling_price || 0);

    const item = sqlite.prepare("SELECT * FROM inventory WHERE id = ?").get(id);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
  }
}
