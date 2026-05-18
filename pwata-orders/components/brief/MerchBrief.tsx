"use client";
import { useEffect, useMemo, useState } from "react";
import { MERCH_STYLES, MERCH_COLORS, MERCH_PLACEMENTS, formatUGX } from "@/lib/services";
import type { MerchCartItem } from "@/lib/brief-helpers";
import PillCluster from "@/components/PillCluster";

interface Product {
  id: string; name: string; category: string;
  base_price: number; print_fee: number;
  image_url: string | null;
  variants: { colors?: string[]; sizes?: string[] } | null;
}

interface Props {
  cart: MerchCartItem[];
  onChange: (cart: MerchCartItem[]) => void;
}

const CATEGORIES = ["All", "apparel", "drinkware", "accessories", "print"];

export default function MerchBrief({ cart, onChange }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Product | null>(null);
  const [variant, setVariant] = useState({ color: "", size: "", qty: 1 });

  useEffect(() => {
    fetch("/api/products-proxy")
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, category, search]);

  const addToCart = () => {
    if (!modal) return;
    const unitPrice = modal.base_price + modal.print_fee;
    const existing = cart.find((c) => c.product_id === modal.id && c.color === variant.color && c.size === variant.size);
    if (existing) {
      onChange(cart.map((c) =>
        c === existing ? { ...c, quantity: c.quantity + variant.qty } : c
      ));
    } else {
      onChange([...cart, {
        product_id: modal.id, product_name: modal.name,
        quantity: variant.qty, unit_price: unitPrice,
        color: variant.color, size: variant.size,
      }]);
    }
    setModal(null);
    setVariant({ color: "", size: "", qty: 1 });
  };

  const updateCartItem = (idx: number, field: keyof MerchCartItem, value: unknown) => {
    onChange(cart.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const removeItem = (idx: number) => onChange(cart.filter((_, i) => i !== idx));

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => s + c.unit_price * c.quantity, 0);

  return (
    <div>
      <p className="section-head" style={{ marginTop: 0 }}>Browse products</p>

      {/* Search */}
      <div className="form-group" style={{ marginBottom: "0.5rem" }}>
        <input
          type="search"
          className="input"
          placeholder="Search products (e.g. hoodie, mug, tote)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
      </div>

      {/* Category tabs */}
      <div className="category-tabs" style={{ marginBottom: "0.5rem" }}>
        {CATEGORIES.map((c) => (
          <button key={c} type="button"
            className={`category-tab${category === c ? " active" : ""}`}
            onClick={() => setCategory(c)}
          >{c}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading products...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", background: "var(--bg-input)", borderRadius: 10, marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.85rem" }}>No products match &quot;{search}&quot;.</p>
          <button type="button" onClick={() => { setSearch(""); setCategory("All"); }}
            style={{ marginTop: "0.5rem", background: "none", border: "none", color: "var(--primary)", fontWeight: 600, cursor: "pointer", fontSize: "0.8rem" }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="product-grid" style={{ marginBottom: cart.length ? "1rem" : "5rem" }}>
          {filtered.map((p) => (
            <button key={p.id} type="button" className="card" style={{ padding: "0.75rem", cursor: "pointer", textAlign: "left" }}
              onClick={() => { setModal(p); setVariant({ color: p.variants?.colors?.[0] ?? "", size: p.variants?.sizes?.[0] ?? "", qty: 1 }); }}
            >
              <div className="product-img" style={{ background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "0.5rem" }}>
                {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎨"}
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--primary)", marginTop: "0.25rem" }}>{formatUGX(p.base_price + p.print_fee)}</div>
            </button>
          ))}
        </div>
      )}

      {/* Cart summary */}
      {cart.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <p className="section-head">Your design briefs</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontWeight: 700 }}>Cart ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
            <span style={{ color: "var(--primary)", fontWeight: 800 }} className="num">{formatUGX(totalPrice)}</span>
          </div>
          {cart.map((item, idx) => (
            <div key={idx} className="brief-card" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{item.product_name}</div>
                  {(item.color || item.size) && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{[item.color, item.size].filter(Boolean).join(" · ")}</div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button type="button" style={{ background: "var(--bg-input)", border: "none", color: "var(--text)", width: 24, height: 24, borderRadius: 4, cursor: "pointer" }}
                    onClick={() => item.quantity > 1 ? updateCartItem(idx, "quantity", item.quantity - 1) : removeItem(idx)}>−</button>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.quantity}</span>
                  <button type="button" style={{ background: "var(--bg-input)", border: "none", color: "var(--text)", width: 24, height: 24, borderRadius: 4, cursor: "pointer" }}
                    onClick={() => updateCartItem(idx, "quantity", item.quantity + 1)}>+</button>
                  <button type="button" style={{ background: "rgba(239,68,68,.15)", border: "none", color: "#ef4444", width: 24, height: 24, borderRadius: 4, cursor: "pointer", fontSize: "0.75rem" }}
                    onClick={() => removeItem(idx)}>✕</button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">What to print *</label>
                <input className="input" placeholder="Text, name, slogan..." value={item.print_text ?? ""} onChange={(e) => updateCartItem(idx, "print_text", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Style</label>
                <PillCluster
                  options={MERCH_STYLES}
                  selected={item.style ?? ""}
                  onChange={(next) => updateCartItem(idx, "style", next)}
                />
              </div>
              <div className="form-group">
                <label className="label">Placement</label>
                <PillCluster
                  options={MERCH_PLACEMENTS}
                  selected={item.placement ?? ""}
                  onChange={(next) => updateCartItem(idx, "placement", next)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add product modal */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <h3 style={{ marginBottom: "1rem" }}>{modal.name}</h3>
            <p style={{ color: "var(--primary)", fontWeight: 800, fontSize: "1.1rem", marginBottom: "1rem" }}>
              {formatUGX(modal.base_price + modal.print_fee)} each
            </p>

            {modal.variants?.colors && (
              <div className="form-group">
                <label className="label">Color</label>
                <div className="style-pills">
                  {modal.variants.colors.map((c) => (
                    <button key={c} type="button"
                      className={`style-pill${variant.color === c ? " selected" : ""}`}
                      onClick={() => setVariant((v) => ({ ...v, color: c }))}
                    >{c}</button>
                  ))}
                </div>
              </div>
            )}
            {modal.variants?.sizes && (
              <div className="form-group">
                <label className="label">Size</label>
                <div className="style-pills">
                  {modal.variants.sizes.map((s) => (
                    <button key={s} type="button"
                      className={`style-pill${variant.size === s ? " selected" : ""}`}
                      onClick={() => setVariant((v) => ({ ...v, size: s }))}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="label">Quantity</label>
              <input type="number" min={1} className="input" style={{ maxWidth: 100 }}
                value={variant.qty} onChange={(e) => setVariant((v) => ({ ...v, qty: Math.max(1, parseInt(e.target.value) || 1) }))} />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={addToCart}>Add to order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
