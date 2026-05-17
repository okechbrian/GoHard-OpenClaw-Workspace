/**
 * Read-only — prints row counts for every transactional table.
 * Run: npx tsx scripts/db-state.ts
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local" });

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) { console.error("DATABASE_URL required"); process.exit(1); }
const sql = neon(url);

async function counts() {
  const tables = [
    "orders", "order_items", "order_status_history",
    "sales", "invoices", "invoice_items", "payments",
    "customers", "expenses", "cash_closes",
    "products", "users",
  ];
  console.log(`→ Neon state @ ${url!.split("@")[1]?.split("/")[0]}\n`);
  for (const t of tables) {
    try {
      const r = (await sql.query(`SELECT COUNT(*) AS n FROM ${t}`)) as Array<{ n: string }>;
      console.log(`  ${t.padEnd(22)} ${String(r[0].n).padStart(5)} rows`);
    } catch (e) {
      console.log(`  ${t.padEnd(22)} (table missing or error)`);
    }
  }
}
counts().catch((e) => { console.error(e); process.exit(1); });
