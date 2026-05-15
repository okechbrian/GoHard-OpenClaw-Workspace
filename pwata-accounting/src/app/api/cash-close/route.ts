import { sql } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

async function getExpectedCash(date: string): Promise<number> {
  const cashIn = (await sql`
    SELECT COALESCE(SUM(amount), 0) AS total FROM sales
    WHERE payment_method = 'cash' AND payment_status = 'paid' AND sale_date = ${date}
  ` as any[])[0];
  const cashOut = (await sql`
    SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
    WHERE payment_method = 'cash' AND expense_date = ${date}
  ` as any[])[0];
  return Number(cashIn.total) - Number(cashOut.total);
}

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const expected = await getExpectedCash(today);
    const todayCloseRows = await sql`SELECT * FROM cash_closes WHERE close_date = ${today}` as any[];
    const history = await sql`SELECT * FROM cash_closes ORDER BY close_date DESC LIMIT 7`;
    return NextResponse.json({ today, expected, todayClose: todayCloseRows[0] ?? null, history });
  } catch (error) {
    console.error("Cash close GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actual_cash, notes } = body;
    if (actual_cash == null || isNaN(Number(actual_cash))) {
      return NextResponse.json({ error: "actual_cash is required" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const expected = await getExpectedCash(today);
    const actual = Number(actual_cash);
    const difference = actual - expected;

    const existing = await sql`SELECT id FROM cash_closes WHERE close_date = ${today}` as any[];

    if (existing[0]) {
      await sql`
        UPDATE cash_closes SET actual_cash = ${actual}, difference = ${difference},
          notes = ${notes ?? null}, created_at = NOW()
        WHERE close_date = ${today}
      `;
    } else {
      await sql`
        INSERT INTO cash_closes (id, close_date, expected_cash, actual_cash, difference, notes)
        VALUES (${generateId()}, ${today}, ${expected}, ${actual}, ${difference}, ${notes ?? null})
      `;
    }

    const recordRows = await sql`SELECT * FROM cash_closes WHERE close_date = ${today}` as any[];
    return NextResponse.json(recordRows[0], { status: 201 });
  } catch (error) {
    console.error("Cash close POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
