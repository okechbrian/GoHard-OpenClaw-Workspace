"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatUGX } from "@/lib/utils";
import { useConfirm } from "@/components/ConfirmDialog";

interface InventoryItem {
  id: string; name: string; description: string; category: string; quantity: number; unit: string; cost_price: number; selling_price: number;
}

const categories = ["Design Templates", "Fonts", "Stock Photos", "Print Materials", "Hardware", "Software License", "Other"];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "Other", quantity: "0", unit: "pcs", cost_price: "0", selling_price: "0" });
  const { confirm, render: renderConfirm } = useConfirm();

  useEffect(() => { fetch("/api/inventory").then((r) => r.json()).then(setItems); }, []);

  const resetForm = () => { setForm({ name: "", description: "", category: "Other", quantity: "0", unit: "pcs", cost_price: "0", selling_price: "0" }); setEditing(null); setShowForm(false); };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description || "", category: item.category || "Other", quantity: String(item.quantity), unit: item.unit, cost_price: String(item.cost_price), selling_price: String(item.selling_price) });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, quantity: parseFloat(form.quantity) || 0, cost_price: parseFloat(form.cost_price) || 0, selling_price: parseFloat(form.selling_price) || 0 };
    if (editing) {
      const res = await fetch(`/api/inventory/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { const updated = await res.json(); setItems(items.map((i) => i.id === editing.id ? { ...i, ...updated } : i)); }
    } else {
      const res = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { const newItem = await res.json(); setItems([...items, newItem]); }
    }
    resetForm();
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete ${name}?`,
      body: "Removes this stock item permanently.",
      danger: true,
      confirmLabel: "Delete item",
    });
    if (!ok) return;
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems(items.filter((i) => i.id !== id));
      toast.success(`${name} deleted`);
    } else {
      toast.error("Failed to delete item");
    }
  };

  const lowStock = items.filter((i) => i.quantity <= 5);

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Inventory</h1><p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{items.length} items</p></div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Item</button>
      </header>

      {lowStock.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem", borderColor: "var(--warning)" }}>
          <p style={{ fontSize: "0.875rem" }}>⚠️ <strong>{lowStock.length}</strong> item(s) running low (≤5 units)</p>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>{editing ? "Edit Item" : "Add Item"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="label">Name *</label><input className="input" placeholder="e.g. Business Card Template" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label className="label">Description</label><input className="input" placeholder="Details about this item" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label className="label">Category</label>
                  <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="form-group"><label className="label">Unit</label>
                  <select className="select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option value="pcs">Pieces</option><option value="sets">Sets</option><option value="hours">Hours</option><option value="licenses">Licenses</option></select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="label">Quantity</label><input className="input" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                <div className="form-group"><label className="label">Cost Price (UGX)</label><input className="input" type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="label">Selling Price (UGX)</label><input className="input" type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} /></div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? "Update" : "Save Item"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {items.map((item) => (
          <div key={item.id} className="card" style={{ borderColor: item.quantity <= 5 ? "var(--warning)" : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{item.name}</h3>
                {item.description && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.description}</p>}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <span className="badge badge-blue">{item.category}</span>
                  <span className={`badge ${item.quantity <= 5 ? "badge-red" : "badge-green"}`}>{item.quantity} {item.unit}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Cost: {formatUGX(item.cost_price)}</p>
                  <p style={{ fontWeight: 600, color: "#22c55e" }}>Sell: {formatUGX(item.selling_price)}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => handleDelete(item.id, item.name)}>🗑️</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <div className="card" style={{ textAlign: "center", color: "var(--text-muted)" }}>No inventory items yet. Tap + Add Item to start.</div>}
      </div>
      {renderConfirm()}
    </div>
  );
}
