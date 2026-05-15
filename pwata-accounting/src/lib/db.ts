import { neon } from "@neondatabase/serverless";
import Database from "better-sqlite3";
import path from "path";
import { generateId } from "./utils";

// ────────────────────────────────────────────────────────────────────────
// New: Neon Postgres SQL tag (use this in all new/converted code paths)
// ────────────────────────────────────────────────────────────────────────
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  // Don't crash at import time during local dev when DB URL isn't loaded yet
  console.warn("⚠ DATABASE_URL not set — Neon SQL calls will fail.");
}
export const sql = neon(url ?? "postgres://placeholder");

// ────────────────────────────────────────────────────────────────────────
// Legacy: better-sqlite3 (admin routes that haven't been migrated yet).
// Works locally; FAILS on Vercel due to read-only filesystem. Routes using
// this should be incrementally converted to `sql`.
// ────────────────────────────────────────────────────────────────────────
const DB_PATH = path.join(process.cwd(), "data", "pwata.db");
let sqlite: Database.Database;
try {
  sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
} catch (err) {
  // On Vercel (read-only fs), creating sqlite fails. Provide a stub that
  // throws clearly so any un-migrated route surfaces a useful error.
  console.warn("⚠ better-sqlite3 unavailable in this environment:", (err as Error).message);
  const stub: any = {};
  const fail = () => { throw new Error("better-sqlite3 not available — migrate this route to Neon (sql)"); };
  stub.prepare = fail;
  stub.exec = fail;
  stub.pragma = fail;
  stub.transaction = fail;
  sqlite = stub as Database.Database;
}

// Initialize SQLite tables for local dev only
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE,
      password_hash TEXT NOT NULL, role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT,
      address TEXT, notes TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY, customer_id TEXT REFERENCES customers(id),
      description TEXT NOT NULL, amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','mtn_momo','airtel_money')),
      payment_status TEXT DEFAULT 'paid' CHECK(payment_status IN ('pending','paid','partial','cancelled')),
      sale_date TEXT DEFAULT (date('now')), notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY, category TEXT NOT NULL, description TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','mtn_momo','airtel_money')),
      expense_date TEXT DEFAULT (date('now')), receipt_url TEXT, notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY, invoice_number TEXT UNIQUE NOT NULL,
      customer_id TEXT REFERENCES customers(id),
      subtotal REAL NOT NULL, tax_rate REAL DEFAULT 0, tax_amount REAL DEFAULT 0,
      total REAL NOT NULL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','overdue','cancelled')),
      due_date TEXT, paid_date TEXT, notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY, invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL, quantity REAL DEFAULT 1,
      unit_price REAL NOT NULL, total REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, category TEXT,
      quantity REAL DEFAULT 0, unit TEXT DEFAULT 'pcs',
      cost_price REAL DEFAULT 0, selling_price REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, customer_id TEXT REFERENCES customers(id),
      sale_id TEXT REFERENCES sales(id), invoice_id TEXT REFERENCES invoices(id),
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','mtn_momo','airtel_money')),
      payment_date TEXT DEFAULT (date('now')), reference TEXT, notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS recurring_invoices (
      id TEXT PRIMARY KEY, customer_id TEXT REFERENCES customers(id),
      description TEXT NOT NULL, amount REAL NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('weekly','biweekly','monthly','quarterly','yearly')),
      payment_method TEXT DEFAULT 'cash',
      start_date TEXT NOT NULL, next_date TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','paused','cancelled')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
      base_price REAL NOT NULL, print_fee REAL DEFAULT 5000,
      description TEXT, image_url TEXT, variants JSON, customizable BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT REFERENCES customers(id),
      guest_name TEXT, guest_phone TEXT, guest_email TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_design','printing','ready_for_delivery','completed','cancelled')),
      total_amount REAL NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('cash','mtn_momo','airtel_money')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','partial','failed')),
      payment_reference TEXT, delivery_address TEXT, notes TEXT,
      artwork_urls JSON, mockup_urls JSON,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY, order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id),
      quantity INTEGER DEFAULT 1, unit_price REAL NOT NULL, subtotal REAL NOT NULL,
      customizations JSON,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY, order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
      status TEXT NOT NULL, changed_by TEXT REFERENCES users(id), notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cash_closes (
      id TEXT PRIMARY KEY, close_date TEXT UNIQUE NOT NULL,
      expected_cash REAL NOT NULL, actual_cash REAL NOT NULL, difference REAL NOT NULL,
      notes TEXT, closed_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  function addColumnIfMissing(table: string, ddl: string) {
    try { sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`); }
    catch (err: any) { if (!err?.message?.includes("duplicate column name")) throw err; }
  }
  addColumnIfMissing("sales", "order_id TEXT REFERENCES orders(id)");
  addColumnIfMissing("invoices", "order_id TEXT REFERENCES orders(id)");
  addColumnIfMissing("orders", "deposit_amount REAL DEFAULT 0");
  addColumnIfMissing("orders", "source TEXT DEFAULT 'admin'");
  addColumnIfMissing("orders", "deadline_date TEXT");
  addColumnIfMissing("orders", "service_type TEXT DEFAULT 'merchandise'");
} catch {
  // sqlite stub — skip local schema init
}

// Re-export so existing call sites that import `generateId` from "@/lib/db" keep working
export { generateId };

// Used by automation.ts (now Postgres-backed)
export async function getOrderWithDetails(orderId: string) {
  const orderRows = await sql`
    SELECT o.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
    FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ${orderId}
  ` as any[];
  const order = orderRows[0];
  if (!order) return null;
  const items = await sql`
    SELECT oi.*, p.name AS product_name, p.base_price, p.print_fee
    FROM order_items oi JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ${orderId}
  ` as any[];
  return { ...order, items };
}

// Legacy seed functions — kept for backwards compat in local dev. No-op on Vercel.
export function seedProductsIfEmpty() { /* legacy: schema now seeded via scripts/migrate-schema.ts */ }
export function seedServiceProductsIfMissing() { /* legacy */ }

// Default export remains the better-sqlite3 instance for un-migrated admin routes.
// On Vercel it's a stub that throws on use.
export default sqlite;
