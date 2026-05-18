"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatUGX } from "@/lib/utils";
import { useConfirm } from "@/components/ConfirmDialog";

interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  print_fee: number;
  description: string | null;
  image_url: string | null;
  variants: string | null;
  customizable: number;
}

const categories = ["apparel", "drinkware", "accessories", "print", "other"];

const categoryColors: Record<string, string> = {
  apparel: "badge-blue",
  drinkware: "badge-green",
  accessories: "badge-yellow",
  print: "badge-gray",
  other: "badge-gray",
};

interface FormState {
  name: string;
  category: string;
  base_price: string;
  print_fee: string;
  description: string;
  image_url: string;
  colors: string;
  sizes: string;
  customizable: boolean;
}

const emptyForm: FormState = {
  name: "",
  category: "apparel",
  base_price: "",
  print_fee: "5000",
  description: "",
  image_url: "",
  colors: "",
  sizes: "",
  customizable: true,
};

function parseVariants(variantsJson: string | null): { colors?: string[]; sizes?: string[] } {
  if (!variantsJson) return {};
  try {
    return JSON.parse(variantsJson);
  } catch {
    return {};
  }
}

function variantsToCSV(variants: string[] | undefined): string {
  return variants?.join(", ") ?? "";
}

function csvToVariants(csv: string): string[] {
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const { confirm, render: renderConfirm } = useConfirm();

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => toast.error("Failed to load products"));
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (p: Product) => {
    const v = parseVariants(p.variants);
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      base_price: String(p.base_price),
      print_fee: String(p.print_fee),
      description: p.description || "",
      image_url: p.image_url || "",
      colors: variantsToCSV(v.colors),
      sizes: variantsToCSV(v.sizes),
      customizable: p.customizable === 1,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const variants: { colors?: string[]; sizes?: string[] } = {};
    const colors = csvToVariants(form.colors);
    const sizes = csvToVariants(form.sizes);
    if (colors.length) variants.colors = colors;
    if (sizes.length) variants.sizes = sizes;

    const payload = {
      name: form.name,
      category: form.category,
      base_price: parseFloat(form.base_price) || 0,
      print_fee: parseFloat(form.print_fee) || 0,
      description: form.description,
      image_url: form.image_url,
      variants: Object.keys(variants).length ? variants : null,
      customizable: form.customizable,
    };

    if (editing) {
      const res = await fetch(`/api/products/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated: Product = await res.json();
        setProducts(products.map((p) => (p.id === editing.id ? updated : p)));
        toast.success("Product updated");
      } else {
        const err = await res.json();
        toast.error(err.error || "Update failed");
      }
    } else {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newProduct: Product = await res.json();
        setProducts([...products, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Product added");
      } else {
        const err = await res.json();
        toast.error(err.error || "Create failed");
      }
    }
    resetForm();
  };

  const handleDelete = async (p: Product) => {
    const ok = await confirm({
      title: `Delete ${p.name}?`,
      body: "Removes the product from the catalogue. Existing orders that reference it stay intact.",
      danger: true,
      confirmLabel: "Delete product",
    });
    if (!ok) return;
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts(products.filter((x) => x.id !== p.id));
      toast.success("Product deleted");
    } else {
      const err = await res.json();
      toast.error(err.error || "Delete failed");
    }
  };

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Catalog</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{products.length} products</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Product</button>
      </header>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>{editing ? "Edit Product" : "Add Product"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Name *</label>
                <input className="input" placeholder="e.g. Classic T-Shirt" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Category *</label>
                  <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: "flex", alignItems: "center", paddingTop: "1.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.customizable} onChange={(e) => setForm({ ...form, customizable: e.target.checked })} />
                    Customizable
                  </label>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Base Price (UGX) *</label>
                  <input className="input" type="number" placeholder="25000" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="label">Print Fee (UGX)</label>
                  <input className="input" type="number" placeholder="5000" value={form.print_fee} onChange={(e) => setForm({ ...form, print_fee: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <input className="input" placeholder="Premium cotton crew neck" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Image URL</label>
                <input className="input" placeholder="/images/products/tshirt-white.png" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Colors (comma-separated)</label>
                <input className="input" placeholder="white, black, navy, red" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Sizes (comma-separated)</label>
                <input className="input" placeholder="S, M, L, XL" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? "Update" : "Save Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
        {products.map((p) => {
          const v = parseVariants(p.variants);
          return (
            <div key={p.id} className="card">
              {p.image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginBottom: "0.75rem", background: "var(--bg-input)" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{p.name}</h3>
                <span className={`badge ${categoryColors[p.category] || "badge-gray"}`}>{p.category}</span>
              </div>
              {p.description && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{p.description}</p>}
              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {v.colors?.map((c) => <span key={c} className="badge badge-gray">{c}</span>)}
                {v.sizes?.map((s) => <span key={s} className="badge badge-gray">{s}</span>)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Base: {formatUGX(p.base_price)}</p>
                  {p.print_fee > 0 && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Print: +{formatUGX(p.print_fee)}</p>}
                  <p style={{ fontWeight: 600, color: "#22c55e", marginTop: "0.25rem" }}>{formatUGX(p.base_price + p.print_fee)}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => openEdit(p)}>✏️</button>
                  <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => handleDelete(p)}>🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
        {!products.length && <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", gridColumn: "1 / -1" }}>No products yet. Tap + Add Product to start.</div>}
      </div>
      {renderConfirm()}
    </div>
  );
}
