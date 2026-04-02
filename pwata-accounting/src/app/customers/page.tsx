"use client";

import { useState, useEffect } from "react";
import { formatUGX, formatDate } from "@/lib/utils";

interface Customer {
  id: string; name: string; phone: string; email: string; address: string; notes: string; total_orders: number; total_spent: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });

  useEffect(() => { fetch("/api/customers").then((r) => r.json()).then(setCustomers); }, []);

  const resetForm = () => { setForm({ name: "", phone: "", email: "", address: "", notes: "" }); setEditing(null); setShowForm(false); };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "", notes: c.notes || "" });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const res = await fetch(`/api/customers/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { const updated = await res.json(); setCustomers(customers.map((c) => c.id === editing.id ? { ...c, ...updated } : c)); }
    } else {
      const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { const newC = await res.json(); setCustomers([...customers, { ...newC, total_orders: 0, total_spent: 0 }]); }
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) setCustomers(customers.filter((c) => c.id !== id));
  };

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Customers</h1><p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{customers.length} clients</p></div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Customer</button>
      </header>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>{editing ? "Edit Customer" : "Add Customer"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="label">Name *</label><input className="input" placeholder="e.g. Kato Brian" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="label">Phone</label><input className="input" placeholder="+256 700 000 000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="form-group"><label className="label">Email</label><input className="input" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="label">Address</label><input className="input" placeholder="e.g. Kampala, Uganda" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? "Update" : "Save Customer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {customers.map((c) => (
          <div key={c.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{c.name}</h3>
                {c.phone && <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>📞 {c.phone}</p>}
                {c.email && <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>✉️ {c.email}</p>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 600, color: "#22c55e" }}>{formatUGX(c.total_spent)}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.total_orders} orders</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => openEdit(c)}>✏️</button>
                  <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => handleDelete(c.id)}>🗑️</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!customers.length && <div className="card" style={{ textAlign: "center", color: "var(--text-muted)" }}>No customers yet.</div>}
      </div>
    </div>
  );
}
