/**
 * One-shot cleanup: removes obvious QA / test orders from the Neon prod DB
 * so tomorrow's dashboard starts at zero. Also nukes any auto-created Sale +
 * Invoice rows for those orders.
 *
 * Run with: npx tsx scripts/cleanup-qa-orders.ts
 *
 * Selection criteria (case-insensitive matches on notes or guest_name):
 *   - guest_name LIKE 'QA %'    (e.g. "QA Ship Test", "QA Website Test")
 *   - notes ILIKE '%SHIP TEST%' / '%SEED CHECK%' / '%do not fulfill%' / '%qa%'
 *   - guest_name = 'Test User'  (from 2026-05-15 seed test)
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local" });

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const sql = neon(url);

async function cleanup() {
  console.log("→ QA cleanup on", url!.split("@")[1]?.split("/")[0] ?? "neon");

  const targets = (await sql`
    SELECT id, order_number, guest_name, notes, payment_status, status
    FROM orders
    WHERE
         guest_name ILIKE 'QA %'
      OR guest_name = 'Test User'
      OR notes ILIKE '%SHIP TEST%'
      OR notes ILIKE '%SEED CHECK%'
      OR notes ILIKE '%do not fulfill%'
      OR notes ILIKE '%do not produce%'
    ORDER BY created_at DESC
  `) as Array<{ id: string; order_number: string; guest_name: string; notes: string | null; payment_status: string; status: string }>;

  if (targets.length === 0) {
    console.log("  · Nothing to clean. Database is already tidy.");
    return;
  }

  console.log(`  · Found ${targets.length} test orders:`);
  for (const t of targets) {
    console.log(`    - ${t.order_number} | ${t.guest_name} | status=${t.status} payment=${t.payment_status}`);
  }

  const ids = targets.map((t) => t.id);

  // 1. Wipe Sales + Invoices auto-created for these orders.
  const saleRows = await sql`
    DELETE FROM sales WHERE order_id = ANY(${ids}::text[]) RETURNING id
  ` as Array<{ id: string }>;
  const invIds = (await sql`
    SELECT id FROM invoices WHERE order_id = ANY(${ids}::text[])
  ` as Array<{ id: string }>).map((r) => r.id);
  if (invIds.length > 0) {
    await sql`DELETE FROM invoice_items WHERE invoice_id = ANY(${invIds}::text[])`;
    await sql`DELETE FROM invoices WHERE id = ANY(${invIds}::text[])`;
  }
  // Payments may FK to these sales/invoices (ON DELETE SET NULL means rows stay).
  // Hard-delete any payments tied to deleted sales/invoices too.
  await sql`DELETE FROM payments WHERE sale_id IS NULL AND invoice_id IS NULL AND reference ILIKE 'qa-%'`;

  // 2. order_items + order_status_history cascade off orders (FK ON DELETE CASCADE).
  const deleted = await sql`
    DELETE FROM orders WHERE id = ANY(${ids}::text[]) RETURNING order_number
  ` as Array<{ order_number: string }>;

  console.log(`  · Deleted ${deleted.length} orders, ${saleRows.length} sales, ${invIds.length} invoices`);
  console.log("✓ Cleanup complete");
}

cleanup().catch((err) => {
  console.error("✗ Cleanup failed:", err);
  process.exit(1);
});
