/**
 * DESTRUCTIVE — wipes all transactional data from the Neon prod DB so the
 * accounting system starts brand new. Keeps the products catalog and the
 * users table (Google OAuth accounts) intact.
 *
 * Run with: npx tsx scripts/wipe-transactional.ts
 *
 * Wipes (in dependency order):
 *   invoice_items → invoices
 *   order_items, order_status_history → orders
 *   payments
 *   sales
 *   expenses
 *   customers
 *   cash_closes
 *
 * KEEPS: products (catalog), users (admin auth)
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local" });

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) { console.error("DATABASE_URL required"); process.exit(1); }
const sql = neon(url);

async function wipe() {
  console.log(`→ Wiping transactional tables on ${url!.split("@")[1]?.split("/")[0]}\n`);

  const ops = [
    ["invoice_items", "DELETE FROM invoice_items"],
    ["invoices",      "DELETE FROM invoices"],
    ["payments",      "DELETE FROM payments"],
    ["sales",         "DELETE FROM sales"],
    ["order_status_history", "DELETE FROM order_status_history"],
    ["order_items",   "DELETE FROM order_items"],
    ["orders",        "DELETE FROM orders"],
    ["expenses",      "DELETE FROM expenses"],
    ["customers",     "DELETE FROM customers"],
    ["cash_closes",   "DELETE FROM cash_closes"],
  ] as const;

  for (const [name, q] of ops) {
    try {
      const r = await sql.query(`${q} RETURNING id`);
      console.log(`  ${name.padEnd(22)} ${String(r.length).padStart(4)} rows deleted`);
    } catch (e: any) {
      console.log(`  ${name.padEnd(22)} ERROR: ${e.message}`);
    }
  }

  console.log("\n→ Post-wipe row counts:");
  const tables = ["orders","sales","invoices","payments","customers","expenses","cash_closes","products","users"];
  for (const t of tables) {
    const r = (await sql.query(`SELECT COUNT(*) AS n FROM ${t}`)) as Array<{ n: string }>;
    console.log(`  ${t.padEnd(15)} ${String(r[0].n).padStart(5)}`);
  }
  console.log("\n✓ Done. Catalog (products) and OAuth users preserved.");
}

wipe().catch((e) => { console.error(e); process.exit(1); });
