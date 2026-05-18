"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatUGX, formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ConfirmDialog";

interface Invoice {
  id: string; invoice_number: string; customer_name: string; subtotal: number; tax_amount: number; total: number; status: string; due_date: string; created_at: string;
}

const statusColors: Record<string, string> = { draft: "badge-gray", sent: "badge-blue", paid: "badge-green", overdue: "badge-red", cancelled: "badge-gray" };

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState({ customer_id: "", due_date: "", notes: "", items: [{ description: "", quantity: 1, unit_price: "" }] });
  const { confirm, render: renderConfirm } = useConfirm();

  useEffect(() => {
    fetch("/api/invoices").then((r) => r.json()).then(setInvoices);
    fetch("/api/customers").then((r) => r.json()).then(setCustomers);
  }, []);

  const addItem = () => setForm({ ...form, items: [...form.items, { description: "", quantity: 1, unit_price: "" }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, value: any) => { const items = [...form.items]; items[i] = { ...items[i], [field]: value }; setForm({ ...form, items }); };

  const resetForm = () => { setForm({ customer_id: "", due_date: "", notes: "", items: [{ description: "", quantity: 1, unit_price: "" }] }); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items: form.items.map((i) => ({ ...i, quantity: parseFloat(String(i.quantity)) || 1, unit_price: parseFloat(i.unit_price) || 0 })) }),
    });
    if (res.ok) {
      const newInv = await res.json();
      setInvoices([{ ...newInv, customer_name: customers.find((c) => c.id === form.customer_id)?.name || "Walk-in" }, ...invoices]);
      resetForm();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/invoices/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) setInvoices(invoices.map((inv) => inv.id === id ? { ...inv, status } : inv));
  };

  const handleDelete = async (id: string, number: string) => {
    const ok = await confirm({
      title: `Delete invoice ${number}?`,
      body: "Removes the invoice and its line items. Linked order and sale rows stay.",
      danger: true,
      confirmLabel: "Delete invoice",
    });
    if (!ok) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) {
      setInvoices(invoices.filter((inv) => inv.id !== id));
      toast.success(`Invoice ${number} deleted`);
    } else {
      toast.error("Failed to delete invoice");
    }
  };

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Invoices</h1><p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{invoices.length} invoices</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Invoice</button>
      </header>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Create Invoice</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="label">Customer</label>
                  <select className="select" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                    <option value="">Walk-in Customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="label">Due Date</label><input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
              <div className="form-group">
                <label className="label">Items</label>
                {form.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "flex-end" }}>
                    <div style={{ flex: 2 }}><input className="input" placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} required /></div>
                    <div style={{ flex: 0.5 }}><input className="input" type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} /></div>
                    <div style={{ flex: 1 }}><input className="input" type="number" placeholder="Price (UGX)" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", e.target.value)} required /></div>
                    {form.items.length > 1 && <button type="button" className="btn btn-ghost" onClick={() => removeItem(i)} style={{ padding: "0.625rem" }}>✕</button>}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost" onClick={addItem} style={{ fontSize: "0.8rem" }}>+ Add Item</button>
              </div>
              <div className="form-group"><label className="label">Notes</label><input className="input" placeholder="Payment terms, etc." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead><tr><th>Invoice #</th><th>Customer</th><th>Total</th><th>Status</th><th>Due</th><th>Actions</th></tr></thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{inv.invoice_number}</td>
                <td>{inv.customer_name || "Walk-in"}</td>
                <td style={{ fontWeight: 600 }}>{formatUGX(inv.total)}</td>
                <td>
                  <select className="select" value={inv.status} onChange={(e) => updateStatus(inv.id, e.target.value)} style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", width: "auto" }}>
                    <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                <td><div style={{ display: "flex", gap: "0.25rem" }}>
                  <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, "_blank")} title="View/Print Invoice">📄</button>
                  <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => handleDelete(inv.id, inv.invoice_number)}>🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!invoices.length && <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No invoices yet.</p>}
      </div>
      {renderConfirm()}
    </div>
  );
}
