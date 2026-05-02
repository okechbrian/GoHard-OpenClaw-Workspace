import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = sqlite.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = sqlite.prepare("SELECT id FROM products WHERE id = ?").get(id);
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const variants = body.variants ? JSON.stringify(body.variants) : null;
    const customizable = body.customizable === false ? 0 : 1;

    sqlite.prepare(`
      UPDATE products SET name = ?, category = ?, base_price = ?, print_fee = ?, description = ?, image_url = ?, variants = ?, customizable = ?
      WHERE id = ?
    `).run(
      body.name,
      body.category,
      Number(body.base_price) || 0,
      Number(body.print_fee) || 0,
      body.description || null,
      body.image_url || null,
      variants,
      customizable,
      id
    );

    const product = sqlite.prepare("SELECT * FROM products WHERE id = ?").get(id);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const refs = sqlite.prepare("SELECT COUNT(*) as count FROM order_items WHERE product_id = ?").get(id) as { count: number };
    if (refs.count > 0) {
      return NextResponse.json(
        { error: `Product is referenced by ${refs.count} order item(s). Cannot delete.` },
        { status: 400 }
      );
    }

    const result = sqlite.prepare("DELETE FROM products WHERE id = ?").run(id);
    if (result.changes === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
