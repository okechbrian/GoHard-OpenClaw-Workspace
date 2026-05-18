"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatUGX, formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ConfirmDialog";

interface Sale {
  id: string;
  customer_name: string;
  description: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  sale_date: string;
  notes: string;
}

const paymentLabels: Record<string, string> = { cash: "Cash", mtn_momo: "MTN MoMo", airtel_money: "Airtel Money" };

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [form, setForm] = useState({ description: "", amount: "", payment_method: "cash", sale_date: new Date().toISOString().split("T")[0], notes: "" });
  const { confirm, render: renderConfirm } = useConfirm();

  useEffect(() => { fetch("/api/sales").then((r) => r.json()).then(setSales).catch(() => toast.error("Failed to load sales")); }, []);

  const resetForm = () => { setForm({ description: "", amount: "", payment_method: "cash", sale_date: new Date().toISOString().split("T")[0], notes: "" }); setEditing(null); setShowForm(false); };

  const openEdit = (sale: Sale) => {
    setEditing(sale);
    setForm({ description: sale.description, amount: String(sale.amount), payment_method: sale.payment_method, sale_date: sale.sale_date, notes: sale.notes || "" });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) };

    if (editing) {
      const res = await fetch(`/api/sales/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const updated = await res.json();
        setSales(sales.map((s) => s.id === editing.id ? { ...s, ...updated } : s));
      }
    } else {
      const res = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { const newSale = await res.json(); setSales([newSale, ...sales]); }
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete this sale?",
      body: "Removes the revenue record. Linked invoice and payment rows stay.",
      danger: true,
      confirmLabel: "Delete sale",
    });
    if (!ok) return;
    const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSales(sales.filter((s) => s.id !== id));
      toast.success("Sale deleted");
    } else {
      toast.error("Failed to delete sale");
    }
  };

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Sales</h1><p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{sales.length} transactions</p></div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Sale</button>
      </header>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>{editing ? "Edit Sale" : "Record Sale"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="label">Description *</label><input className="input" placeholder="e.g. Logo design for Kato" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="label">Amount (UGX) *</label><input className="input" type="number" placeholder="50000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                <div className="form-group"><label className="label">Payment Method *</label>
                  <select className="select" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                    <option value="cash">💵 Cash</option><option value="mtn_momo">📱 MTN MoMo</option><option value="airtel_money">📱 Airtel Money</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="label">Date</label><input className="input" type="date" value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} /></div>
              <div className="form-group"><label className="label">Notes</label><input className="input" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? "Update" : "Save Sale"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td style={{ whiteSpace: "nowrap" }}>{formatDate(sale.sale_date)}</td>
                <td>{sale.description}</td>
                <td style={{ fontWeight: 600 }}>{formatUGX(sale.amount)}</td>
                <td><span className="badge badge-blue">{paymentLabels[sale.payment_method]}</span></td>
                <td><span className={`badge ${sale.payment_status === "paid" ? "badge-green" : sale.payment_status === "pending" ? "badge-yellow" : "badge-red"}`}>{sale.payment_status}</span></td>
                <td>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => openEdit(sale)}>✏️</button>
                    <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => handleDelete(sale.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!sales.length && <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No sales yet. Tap + New Sale to start.</p>}
      </div>
      {renderConfirm()}
    </div>
  );
}
