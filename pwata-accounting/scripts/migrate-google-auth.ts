/**
 * Google OAuth migration: switches users table from bcrypt to OAuth-backed
 * and adds payments → sales/invoices FK constraints (critique fix #1).
 *
 * Run with: npx tsx scripts/migrate-google-auth.ts
 *
 * Idempotent. Safe to re-run.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local" });

const rawUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!rawUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const dbUrl: string = rawUrl;
const sql = neon(dbUrl);

async function migrate() {
  console.log("→ Google OAuth migration on", dbUrl.split("@")[1]?.split("/")[0] ?? "neon");

  // Users: add OAuth columns, drop bcrypt rows + password_hash.
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS picture_url TEXT`;
  const deleted = await sql`DELETE FROM users WHERE google_id IS NULL RETURNING id`;
  console.log(`  · users: dropped ${deleted.length} bcrypt rows`);
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS password_hash`;

  // Payments: add FK constraints (critique fix #1).
  // Postgres has no ADD CONSTRAINT IF NOT EXISTS, so wrap in DO/EXCEPTION.
  await sql`DO $$ BEGIN
    ALTER TABLE payments
      ADD CONSTRAINT payments_sale_id_fk
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`;

  await sql`DO $$ BEGIN
    ALTER TABLE payments
      ADD CONSTRAINT payments_invoice_id_fk
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`;

  await sql`CREATE INDEX IF NOT EXISTS payments_sale_id_idx ON payments(sale_id)`;
  await sql`CREATE INDEX IF NOT EXISTS payments_invoice_id_idx ON payments(invoice_id)`;

  console.log("✓ Migration complete");
}

migrate().catch((err) => {
  console.error("✗ Migration failed:", err);
  process.exit(1);
});
