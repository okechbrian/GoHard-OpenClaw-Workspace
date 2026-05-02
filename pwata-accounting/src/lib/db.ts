import Database from "better-sqlite3";
import path from "path";
import { generateId } from "./utils";

const DB_PATH = path.join(process.cwd(), "data", "pwata.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Initialize tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'mtn_momo', 'airtel_money')),
    payment_status TEXT DEFAULT 'paid' CHECK(payment_status IN ('pending', 'paid', 'partial', 'cancelled')),
    sale_date TEXT DEFAULT (date('now')),
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'mtn_momo', 'airtel_money')),
    expense_date TEXT DEFAULT (date('now')),
    receipt_url TEXT,
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id),
    subtotal REAL NOT NULL,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date TEXT,
    paid_date TEXT,
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit_price REAL NOT NULL,
    total REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    cost_price REAL DEFAULT 0,
    selling_price REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    sale_id TEXT REFERENCES sales(id),
    invoice_id TEXT REFERENCES invoices(id),
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'mtn_momo', 'airtel_money')),
    payment_date TEXT DEFAULT (date('now')),
    reference TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recurring_invoices (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    payment_method TEXT DEFAULT 'cash',
    start_date TEXT NOT NULL,
    next_date TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'cancelled')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Merchandise catalog
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    base_price REAL NOT NULL,
    print_fee REAL DEFAULT 5000,
    description TEXT,
    image_url TEXT,
    variants JSON,
    customizable BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Core orders
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id),
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_design','printing','ready_for_delivery','completed','cancelled')),
    total_amount REAL NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash','mtn_momo','airtel_money')),
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','partial','failed')),
    payment_reference TEXT,
    delivery_address TEXT,
    notes TEXT,
    artwork_urls JSON,
    mockup_urls JSON,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Order line items
  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    customizations JSON,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Status audit trail
  CREATE TABLE IF NOT EXISTS order_status_history (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by TEXT REFERENCES users(id),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Add a column to a table if it doesn't already exist.
// Uses try-catch (not PRAGMA) to handle concurrent build workers safely.
function addColumnIfMissing(table: string, _column: string, ddl: string) {
  try {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  } catch (err: any) {
    if (!err?.message?.includes("duplicate column name")) throw err;
  }
}
addColumnIfMissing("sales", "order_id", "order_id TEXT REFERENCES orders(id)");
addColumnIfMissing("invoices", "order_id", "order_id TEXT REFERENCES orders(id)");
addColumnIfMissing("orders", "deposit_amount", "deposit_amount REAL DEFAULT 0");
addColumnIfMissing("orders", "source", "source TEXT DEFAULT 'admin'");
addColumnIfMissing("orders", "deadline_date", "deadline_date TEXT");

export function seedProductsIfEmpty() {
  try {
    const count = sqlite.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
    if (count.count > 0) {
      console.log("ℹ️ Products already seeded");
      return;
    }

  const products = [
    { id: "prod_tshirt", name: "Classic T-Shirt", category: "apparel", base_price: 25000, print_fee: 8000, description: "Premium cotton crew neck", image_url: "/images/products/tshirt-white.png", variants: JSON.stringify({ colors: ["white", "black", "navy", "red"], sizes: ["S", "M", "L", "XL"] }), customizable: 1 },
    { id: "prod_hoodie", name: "Heavyweight Hoodie", category: "apparel", base_price: 65000, print_fee: 12000, description: "Fleece-lined hoodie", image_url: "/images/products/hoodie-black.png", variants: JSON.stringify({ colors: ["black", "grey", "navy"], sizes: ["S", "M", "L", "XL"] }), customizable: 1 },
    { id: "prod_mug", name: "Ceramic Mug 11oz", category: "drinkware", base_price: 18000, print_fee: 5000, description: "Dishwasher safe ceramic mug", image_url: "/images/products/mug-white.png", variants: JSON.stringify({ colors: ["white", "black"] }), customizable: 1 },
    { id: "prod_cap", name: "Snapback Cap", category: "accessories", base_price: 22000, print_fee: 6000, description: "Adjustable snapback", image_url: "/images/products/cap-black.png", variants: JSON.stringify({ colors: ["black", "navy", "red"] }), customizable: 1 },
    { id: "prod_poster", name: "A3 Poster Print", category: "print", base_price: 15000, print_fee: 0, description: "High-quality matte poster", image_url: "/images/products/poster.png", variants: JSON.stringify({ sizes: ["A3", "A4"] }), customizable: 1 },
    { id: "prod_tote", name: "Canvas Tote Bag", category: "accessories", base_price: 28000, print_fee: 7000, description: "Heavy canvas tote", image_url: "/images/products/tote-natural.png", variants: JSON.stringify({ colors: ["natural", "black"] }), customizable: 1 },
    { id: "prod_hoodie_zip", name: "Zip-Up Hoodie", category: "apparel", base_price: 72000, print_fee: 12000, description: "Full-zip fleece hoodie", image_url: "/images/products/hoodie-zip-black.png", variants: JSON.stringify({ colors: ["black", "grey"], sizes: ["S", "M", "L", "XL"] }), customizable: 1 },
    { id: "prod_bottle", name: "Stainless Steel Bottle 500ml", category: "drinkware", base_price: 35000, print_fee: 8000, description: "Insulated water bottle", image_url: "/images/products/bottle-silver.png", variants: JSON.stringify({ colors: ["silver", "black"] }), customizable: 1 }
  ];

  const insert = sqlite.prepare(`
    INSERT INTO products (id, name, category, base_price, print_fee, description, image_url, variants, customizable, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

    const now = new Date().toISOString();
    for (const p of products) {
      insert.run(p.id, p.name, p.category, p.base_price, p.print_fee, p.description, p.image_url, p.variants, p.customizable);
    }

    console.log("✅ Seeded 8 products for Pwata Creatives");
  } catch (error) {
    console.error("❌ Product seeding failed:", error);
  }
}

// Auto-seed products on first run
seedProductsIfEmpty();

// Helper function for automation service
export function getOrderWithDetails(orderId: string) {
  const order = sqlite.prepare(`
    SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
    FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `).get(orderId) as any;

  if (!order) return null;

  const items = sqlite.prepare(`
    SELECT oi.*, p.name as product_name, p.base_price, p.print_fee
    FROM order_items oi JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(orderId);

  return { ...order, items };
}

export default sqlite;
