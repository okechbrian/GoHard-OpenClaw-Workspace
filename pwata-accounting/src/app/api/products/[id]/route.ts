import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await sql`SELECT * FROM products WHERE id = ${id}` as any[];
    if (!rows[0]) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await sql`SELECT id FROM products WHERE id = ${id}` as any[];
    if (!existing[0]) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const variants = body.variants ? JSON.stringify(body.variants) : null;
    const customizable = body.customizable !== false;

    if (variants) {
      await sql`
        UPDATE products SET name = ${body.name}, category = ${body.category},
          base_price = ${Number(body.base_price) || 0}, print_fee = ${Number(body.print_fee) || 0},
          description = ${body.description || null}, image_url = ${body.image_url || null},
          variants = ${variants}::jsonb, customizable = ${customizable}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE products SET name = ${body.name}, category = ${body.category},
          base_price = ${Number(body.base_price) || 0}, print_fee = ${Number(body.print_fee) || 0},
          description = ${body.description || null}, image_url = ${body.image_url || null},
          variants = NULL, customizable = ${customizable}
        WHERE id = ${id}
      `;
    }

    const rows = await sql`SELECT * FROM products WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const refs = (await sql`SELECT COUNT(*)::int AS count FROM order_items WHERE product_id = ${id}` as Array<{ count: number }>)[0];
    if (refs.count > 0) {
      return NextResponse.json(
        { error: `Product is referenced by ${refs.count} order item(s). Cannot delete.` },
        { status: 400 }
      );
    }
    const result = (await sql`DELETE FROM products WHERE id = ${id} RETURNING id` as any[]);
    if (result.length === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
