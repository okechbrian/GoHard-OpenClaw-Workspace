import { sql } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await sql`SELECT * FROM products ORDER BY name ASC`;
    return NextResponse.json(products);
  } catch (error) {
    console.error("products fetch failed:", error);
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
    const customizable = body.customizable !== false;

    if (variants) {
      await sql`
        INSERT INTO products (id, name, category, base_price, print_fee, description, image_url, variants, customizable)
        VALUES (${id}, ${body.name}, ${body.category}, ${Number(body.base_price) || 0}, ${Number(body.print_fee) || 0},
                ${body.description || null}, ${body.image_url || null}, ${variants}::jsonb, ${customizable})
      `;
    } else {
      await sql`
        INSERT INTO products (id, name, category, base_price, print_fee, description, image_url, customizable)
        VALUES (${id}, ${body.name}, ${body.category}, ${Number(body.base_price) || 0}, ${Number(body.print_fee) || 0},
                ${body.description || null}, ${body.image_url || null}, ${customizable})
      `;
    }

    const rows = await sql`SELECT * FROM products WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
