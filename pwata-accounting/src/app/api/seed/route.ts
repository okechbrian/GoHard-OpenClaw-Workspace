import { sql } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Seed customers
    const customers = [
      { name: "Kato Brian", phone: "+256 701 234 567", email: "kato@example.com" },
      { name: "Nakamya Sarah", phone: "+256 702 345 678", email: "sarah@example.com" },
      { name: "Ssemakula John", phone: "+256 703 456 789", email: "" },
      { name: "Nalwoga Grace", phone: "+256 704 567 890", email: "grace@example.com" },
    ];
    const customerIds: string[] = [];
    for (const c of customers) {
      const id = generateId();
      customerIds.push(id);
      await sql`INSERT INTO customers (id, name, phone, email) VALUES (${id}, ${c.name}, ${c.phone}, ${c.email || null})`;
    }

    const salesData = [
      { cust: 0, desc: "Logo design - Coffee shop", amount: 150000, method: "mtn_momo", date: "2026-03-28" },
      { cust: 1, desc: "Business card design (100 pcs)", amount: 50000, method: "cash", date: "2026-03-29" },
      { cust: 2, desc: "Flyer design - Event", amount: 80000, method: "airtel_money", date: "2026-03-30" },
      { cust: 0, desc: "Banner design (2x1m)", amount: 120000, method: "mtn_momo", date: "2026-03-31" },
      { cust: 3, desc: "Social media kit (5 templates)", amount: 200000, method: "cash", date: "2026-04-01" },
      { cust: 1, desc: "Poster design", amount: 60000, method: "mtn_momo", date: "2026-04-01" },
    ];
    for (const s of salesData) {
      await sql`INSERT INTO sales (id, customer_id, description, amount, payment_method, payment_status, sale_date)
        VALUES (${generateId()}, ${customerIds[s.cust]}, ${s.desc}, ${s.amount}, ${s.method}, 'paid', ${s.date})`;
    }

    const expData = [
      { cat: "Internet/Data", desc: "Monthly internet bundle", amount: 50000, method: "mtn_momo", date: "2026-03-28" },
      { cat: "Printing", desc: "Business card printing", amount: 25000, method: "cash", date: "2026-03-29" },
      { cat: "Design Software", desc: "Canva Pro subscription", amount: 35000, method: "mtn_momo", date: "2026-03-30" },
      { cat: "Transport", desc: "Client meeting - Kampala", amount: 15000, method: "cash", date: "2026-03-31" },
      { cat: "Materials", desc: "Printer ink", amount: 45000, method: "cash", date: "2026-04-01" },
    ];
    for (const e of expData) {
      await sql`INSERT INTO expenses (id, category, description, amount, payment_method, expense_date)
        VALUES (${generateId()}, ${e.cat}, ${e.desc}, ${e.amount}, ${e.method}, ${e.date})`;
    }

    return NextResponse.json({ success: true, message: "Seeded 4 customers, 6 sales, 5 expenses" });
  } catch (error) {
    console.error("seed failed:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
