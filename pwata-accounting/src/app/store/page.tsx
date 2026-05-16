"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  print_fee: number;
  description: string | null;
  image_url: string | null;
  variants: { colors?: string[]; sizes?: string[] } | null;
  customizable: boolean;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  image_url: string | null;
  base_price: number;
  print_fee: number;
  quantity: number;
  color?: string;
  size?: string;
  print_text?: string;
  style?: string;
  color_scheme?: string;
  placement?: string;
  inspiration?: string;
}

const CATEGORIES = ["All", "Apparel", "Drinkware", "Accessories", "Print"];

const CATEGORY_BADGE: Record<string, string> = {
  apparel: "badge-blue",
  drinkware: "badge-green",
  accessories: "badge-yellow",
  print: "badge-purple",
  other: "badge-gray",
};

function formatUGX(n: number) {
  return `UGX ${n.toLocaleString("en-UG")}`;
}

function AddModal({ product, onAdd, onClose }: { product: Product; onAdd: (item: CartItem) => void; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(product.variants?.colors?.[0] ?? "");
  const [size, setSize] = useState(product.variants?.sizes?.[0] ?? "");

  const unitPrice = product.base_price + product.print_fee;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>{product.name}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}>×</button>
        </div>

        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, marginBottom: "1rem" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        )}

        <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          {formatUGX(product.base_price)} base + {formatUGX(product.print_fee)} print = <strong style={{ color: "var(--primary)" }}>{formatUGX(unitPrice)} each</strong>
        </div>

        {product.variants?.colors && product.variants.colors.length > 0 && (
          <div className="form-group">
            <label className="label">Color</label>
            <select className="select" value={color} onChange={(e) => setColor(e.target.value)}>
              {product.variants.colors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {product.variants?.sizes && product.variants.sizes.length > 0 && (
          <div className="form-group">
            <label className="label">Size</label>
            <select className="select" value={size} onChange={(e) => setSize(e.target.value)}>
              {product.variants.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="label">Quantity</label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text)", fontSize: "1.25rem", cursor: "pointer" }}>−</button>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, minWidth: 24, textAlign: "center" }}>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text)", fontSize: "1.25rem", cursor: "pointer" }}>+</button>
            <span style={{ marginLeft: "auto", fontWeight: 700, color: "#22c55e" }}>{formatUGX(unitPrice * qty)}</span>
          </div>
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem", textAlign: "center" }}>
          🎨 You&apos;ll describe your design on the next step
        </p>

        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => {
            onAdd({ product_id: product.id, product_name: product.name, image_url: product.image_url, base_price: product.base_price, print_fee: product.print_fee, quantity: qty, color: color || undefined, size: size || undefined });
            toast.success(`${product.name} added to cart`);
            onClose();
          }}
        >
          Add to Cart — {formatUGX(unitPrice * qty)}
        </button>
      </div>
    </div>
  );
}

export default function StorePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addingProduct, setAddingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/store/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("pwata_cart");
    if (saved) { try { setCart(JSON.parse(saved)); } catch { /* ignore */ } }
  }, []);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const updated = [...prev, item];
      sessionStorage.setItem("pwata_cart", JSON.stringify(updated));
      return updated;
    });
  };

  const cartTotal = cart.reduce((sum, it) => sum + (it.base_price + it.print_fee) * it.quantity, 0);
  const cartCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  const filtered = activeCategory === "All"
    ? products
    : products.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <>
      <div className="store-hero">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "0.5rem" }}>
          Order Custom Merch 🎨
        </h1>
        <p style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: "0.75rem" }}>
          T-shirts, hoodies, mugs and more, printed for you
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", background: "rgba(0,0,0,0.25)", borderRadius: 20, padding: "0.3rem 0.75rem", fontSize: "0.8rem", fontWeight: 600 }}>
          📱 Pay 50% deposit via MTN MoMo or Airtel Money
        </div>
      </div>

      <div className="category-tabs">
        {CATEGORIES.map((cat) => (
          <button key={cat} className={`category-tab${activeCategory === cat ? " active" : ""}`} onClick={() => setActiveCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem" }} />
          Loading products…
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No products in this category.</p>
      ) : (
        <div className="product-grid">
          {filtered.map((p) => (
            <div key={p.id} className="card" style={{ padding: "0.75rem", cursor: "pointer" }} onClick={() => setAddingProduct(p)}>
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="product-img" style={{ marginBottom: "0.5rem" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="product-img" style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>📦</div>
              )}
              <span className={`badge ${CATEGORY_BADGE[p.category] ?? "badge-gray"}`} style={{ fontSize: "0.6rem", marginBottom: "0.25rem" }}>
                {p.category}
              </span>
              <p style={{ fontWeight: 700, fontSize: "0.8rem", lineHeight: 1.3, margin: "0.25rem 0" }}>{p.name}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {formatUGX(p.base_price + p.print_fee)}
              </p>
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", padding: "0.5rem", fontSize: "0.8rem" }}
                onClick={(e) => { e.stopPropagation(); setAddingProduct(p); }}
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      )}

      {addingProduct && (
        <AddModal product={addingProduct} onAdd={addToCart} onClose={() => setAddingProduct(null)} />
      )}

      {cart.length > 0 && (
        <button className="cart-bar" onClick={() => router.push("/store/order")}>
          <span>🛒 {cartCount} item{cartCount !== 1 ? "s" : ""}</span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {formatUGX(cartTotal)}
            <span style={{ fontSize: "1rem" }}>→</span>
          </span>
        </button>
      )}
    </>
  );
}
