/**
 * One-time schema migration: creates the Postgres schema on Neon
 * and seeds product catalog. Idempotent (CREATE TABLE IF NOT EXISTS).
 *
 * Run with: npx tsx scripts/migrate-schema.ts
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local" });

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const dbUrl: string = url;
const sql = neon(dbUrl);

async function migrate() {
  console.log("→ Creating schema on", dbUrl.split("@")[1]?.split("/")[0] ?? "neon");

  // Tables ---------------------------------------------------------------
  await sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'mtn_momo', 'airtel_money')),
    payment_status TEXT DEFAULT 'paid' CHECK(payment_status IN ('pending', 'paid', 'partial', 'cancelled')),
    sale_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'mtn_momo', 'airtel_money')),
    expense_date DATE DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id),
    subtotal NUMERIC NOT NULL,
    tax_rate NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    total NUMERIC NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    quantity NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    cost_price NUMERIC DEFAULT 0,
    selling_price NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    sale_id TEXT REFERENCES sales(id),
    invoice_id TEXT REFERENCES invoices(id),
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'mtn_momo', 'airtel_money')),
    payment_date DATE DEFAULT CURRENT_DATE,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS recurring_invoices (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    payment_method TEXT DEFAULT 'cash',
    start_date DATE NOT NULL,
    next_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    base_price NUMERIC NOT NULL,
    print_fee NUMERIC DEFAULT 5000,
    description TEXT,
    image_url TEXT,
    variants JSONB,
    customizable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id),
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_design','printing','ready_for_delivery','completed','cancelled')),
    total_amount NUMERIC NOT NULL,
    deposit_amount NUMERIC DEFAULT 0,
    source TEXT DEFAULT 'admin',
    service_type TEXT DEFAULT 'merchandise',
    payment_method TEXT CHECK(payment_method IN ('cash','mtn_momo','airtel_money')),
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','partial','failed')),
    payment_reference TEXT,
    delivery_address TEXT,
    notes TEXT,
    deadline_date DATE,
    artwork_urls JSONB,
    mockup_urls JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    customizations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS order_status_history (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by TEXT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS bot_sessions (
    id TEXT PRIMARY KEY,
    chat_id TEXT UNIQUE NOT NULL,
    history JSONB DEFAULT '[]'::jsonb,
    is_human_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS cash_closes (
    id TEXT PRIMARY KEY,
    close_date DATE UNIQUE NOT NULL,
    expected_cash NUMERIC NOT NULL,
    actual_cash NUMERIC NOT NULL,
    difference NUMERIC NOT NULL,
    notes TEXT,
    closed_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // sales/invoices.order_id added later — make idempotent ADDs
  await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS order_id TEXT REFERENCES orders(id)`;
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS order_id TEXT REFERENCES orders(id)`;

  console.log("✓ Schema created");

  // User seeding moved to OAuth callback (see src/app/api/auth/callback/google/route.ts).
  // The users table is now populated when an allowlisted Google account first signs in.

  // Seed merchandise products (idempotent) ------------------------------
  const merch = [
    ["prod_tshirt", "Classic T-Shirt", "apparel", 25000, 8000, "Premium cotton crew neck", "/images/products/tshirt-white.png", { colors: ["white","black","navy","red"], sizes: ["S","M","L","XL"] }, true],
    ["prod_hoodie", "Heavyweight Hoodie", "apparel", 65000, 12000, "Fleece-lined hoodie", "/images/products/hoodie-black.png", { colors: ["black","grey","navy"], sizes: ["S","M","L","XL"] }, true],
    ["prod_mug", "Ceramic Mug 11oz", "drinkware", 18000, 5000, "Dishwasher safe ceramic mug", "/images/products/mug-white.png", { colors: ["white","black"] }, true],
    ["prod_cap", "Snapback Cap", "accessories", 22000, 6000, "Adjustable snapback", "/images/products/cap-black.png", { colors: ["black","navy","red"] }, true],
    ["prod_poster", "A3 Poster Print", "print", 15000, 0, "High-quality matte poster", "/images/products/poster.png", { sizes: ["A3","A4"] }, true],
    ["prod_tote", "Canvas Tote Bag", "accessories", 28000, 7000, "Heavy canvas tote", "/images/products/tote-natural.png", { colors: ["natural","black"] }, true],
    ["prod_hoodie_zip", "Zip-Up Hoodie", "apparel", 72000, 12000, "Full-zip fleece hoodie", "/images/products/hoodie-zip-black.png", { colors: ["black","grey"], sizes: ["S","M","L","XL"] }, true],
    ["prod_bottle", "Stainless Steel Bottle 500ml", "drinkware", 35000, 8000, "Insulated water bottle", "/images/products/bottle-silver.png", { colors: ["silver","black"] }, true],
  ] as const;
  for (const [id, name, cat, bp, pf, desc, img, vars, cust] of merch) {
    await sql`INSERT INTO products (id, name, category, base_price, print_fee, description, image_url, variants, customizable)
      VALUES (${id}, ${name}, ${cat}, ${bp}, ${pf}, ${desc}, ${img}, ${JSON.stringify(vars)}::jsonb, ${cust})
      ON CONFLICT (id) DO NOTHING`;
  }

  // Seed service products (idempotent) ----------------------------------
  const services = [
    ["svc_logo_basic", "Logo Only", 80000, "Custom logo design"],
    ["svc_logo_brand", "Logo + Brand Guidelines", 150000, "Logo with color and font guide"],
    ["svc_logo_full", "Full Brand Identity", 280000, "Complete brand package"],
    ["svc_social_basic", "Social Media Pack (5 posts)", 60000, "5 social media graphics"],
    ["svc_social_full", "Social Media Pack (10 posts)", 100000, "10 social media graphics"],
    ["svc_print_flyer", "Print Design — Flyer/Poster", 35000, "Single print design"],
    ["svc_print_menu", "Print Design — Menu/Brochure", 55000, "Multi-page print design"],
    ["svc_print_card", "Print Design — Business Card", 25000, "Business card design"],
    ["svc_website_landing", "Landing Page", 350000, "Single-page website, contact form, mobile, hosted on Vercel/Netlify (1 year free)"],
    ["svc_website_multi", "Multi-Page Website", 900000, "Up to 5 pages, CMS-lite, blog optional"],
    ["svc_website_full", "Full Website + CMS", 2000000, "10+ pages, full CMS, blog, custom design"],
    ["svc_website_ecom", "E-Commerce Store", 2800000, "Catalog, cart, Flutterwave/MoMo checkout, admin"],
    ["svc_bot_faq", "FAQ Bot (WhatsApp + Telegram)", 400000, "Menu-driven, 5-10 nodes, both platforms"],
    ["svc_bot_intake", "Intake/Lead Bot (WhatsApp + Telegram)", 750000, "Captures orders/leads, syncs to Sheets or email"],
    ["svc_bot_full", "Full Conversational Bot (WhatsApp + Telegram)", 1800000, "AI Q&A, integrations, multilingual"],
  ] as const;
  for (const [id, name, bp, desc] of services) {
    await sql`INSERT INTO products (id, name, category, base_price, print_fee, description, customizable)
      VALUES (${id}, ${name}, 'services', ${bp}, 0, ${desc}, false)
      ON CONFLICT (id) DO NOTHING`;
  }

  console.log("✓ Seeded products");
  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error("✗ Migration failed:", err);
  process.exit(1);
});
