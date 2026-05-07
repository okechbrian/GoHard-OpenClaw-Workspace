import sqlite from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

function getExpectedCash(date: string): number {
  const cashIn = sqlite.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM sales
    WHERE payment_method = 'cash' AND payment_status = 'paid' AND sale_date = ?
  `).get(date) as { total: number };

  const cashOut = sqlite.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses
    WHERE payment_method = 'cash' AND expense_date = ?
  `).get(date) as { total: number };

  return cashIn.total - cashOut.total;
}

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const expected = getExpectedCash(today);

    const todayClose = sqlite.prepare(
      "SELECT * FROM cash_closes WHERE close_date = ?"
    ).get(today) as any;

    const history = sqlite.prepare(
      "SELECT * FROM cash_closes ORDER BY close_date DESC LIMIT 7"
    ).all();

    return NextResponse.json({ today, expected, todayClose: todayClose ?? null, history });
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
    const expected = getExpectedCash(today);
    const actual = Number(actual_cash);
    const difference = actual - expected;

    const existing = sqlite.prepare(
      "SELECT id FROM cash_closes WHERE close_date = ?"
    ).get(today) as any;

    if (existing) {
      sqlite.prepare(`
        UPDATE cash_closes SET actual_cash = ?, difference = ?, notes = ?, created_at = datetime('now')
        WHERE close_date = ?
      `).run(actual, difference, notes ?? null, today);
    } else {
      sqlite.prepare(`
        INSERT INTO cash_closes (id, close_date, expected_cash, actual_cash, difference, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(generateId(), today, expected, actual, difference, notes ?? null);
    }

    const record = sqlite.prepare("SELECT * FROM cash_closes WHERE close_date = ?").get(today);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Cash close POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
