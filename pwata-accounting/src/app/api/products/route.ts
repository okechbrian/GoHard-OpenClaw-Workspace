import sqlite from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const products = sqlite.prepare("SELECT * FROM products ORDER BY name ASC").all();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.category || body.base_price == null) {
      return NextResponse.json({ error: "name, category, and base_price are required" }, { status: 400 });
    }

    const id = generateId();
    const variants = body.variants ? JSON.stringify(body.variants) : null;
    const customizable = body.customizable === false ? 0 : 1;

    sqlite.prepare(`
      INSERT INTO products (id, name, category, base_price, print_fee, description, image_url, variants, customizable, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id,
      body.name,
      body.category,
      Number(body.base_price) || 0,
      Number(body.print_fee) || 0,
      body.description || null,
      body.image_url || null,
      variants,
      customizable
    );

    const product = sqlite.prepare("SELECT * FROM products WHERE id = ?").get(id);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
