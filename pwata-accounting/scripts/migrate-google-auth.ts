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

  // Discover every FK pointing at users and null out references owned by
  // the rows we're about to delete (the FKs default to NO ACTION).
  const fks = (await sql`
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'users'
      AND tc.table_name <> 'users'
  `) as Array<{ table_name: string; column_name: string }>;

  for (const fk of fks) {
    // table_name and column_name come from information_schema and are
    // standard lowercase identifiers — safe to inline.
    await sql.query(
      `UPDATE "${fk.table_name}" SET "${fk.column_name}" = NULL
       WHERE "${fk.column_name}" IN (SELECT id FROM users WHERE google_id IS NULL)`
    );
    console.log(`  · nulled refs in ${fk.table_name}.${fk.column_name}`);
  }

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
