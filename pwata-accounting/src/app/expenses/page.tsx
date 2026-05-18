"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatUGX, formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ConfirmDialog";

interface Expense {
  id: string; category: string; description: string; amount: number; payment_method: string; expense_date: string; notes: string;
}

const categories = ["Design Software", "Internet/Data", "Printing", "Materials", "Transport", "Marketing", "Utilities", "Rent", "Other"];
const paymentLabels: Record<string, string> = { cash: "Cash", mtn_momo: "MTN MoMo", airtel_money: "Airtel Money" };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ category: "Other", description: "", amount: "", payment_method: "cash", expense_date: new Date().toISOString().split("T")[0], notes: "" });
  const { confirm, render: renderConfirm } = useConfirm();

  useEffect(() => { fetch("/api/expenses").then((r) => r.json()).then(setExpenses); }, []);

  const resetForm = () => { setForm({ category: "Other", description: "", amount: "", payment_method: "cash", expense_date: new Date().toISOString().split("T")[0], notes: "" }); setEditing(null); setShowForm(false); };

  const openEdit = (exp: Expense) => {
    setEditing(exp);
    setForm({ category: exp.category, description: exp.description, amount: String(exp.amount), payment_method: exp.payment_method, expense_date: exp.expense_date, notes: exp.notes || "" });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (editing) {
      const res = await fetch(`/api/expenses/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { const updated = await res.json(); setExpenses(expenses.map((e) => e.id === editing.id ? { ...e, ...updated } : e)); }
    } else {
      const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { const newExp = await res.json(); setExpenses([newExp, ...expenses]); }
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete this expense?",
      body: "Removes the expense record permanently.",
      danger: true,
      confirmLabel: "Delete expense",
    });
    if (!ok) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setExpenses(expenses.filter((e) => e.id !== id));
      toast.success("Expense deleted");
    } else {
      toast.error("Failed to delete expense");
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Expenses</h1><p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Total: {formatUGX(totalExpenses)}</p></div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Expense</button>
      </header>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>{editing ? "Edit Expense" : "Add Expense"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="label">Category *</label>
                  <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="form-group"><label className="label">Amount (UGX) *</label><input className="input" type="number" placeholder="25000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label className="label">Description *</label><input className="input" placeholder="e.g. Monthly internet bundle" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="label">Payment Method *</label>
                  <select className="select" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}><option value="cash">💵 Cash</option><option value="mtn_momo">📱 MTN MoMo</option><option value="airtel_money">📱 Airtel Money</option></select>
                </div>
                <div className="form-group"><label className="label">Date</label><input className="input" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? "Update" : "Save Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Payment</th><th>Actions</th></tr></thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id}>
                <td style={{ whiteSpace: "nowrap" }}>{formatDate(exp.expense_date)}</td>
                <td><span className="badge badge-yellow">{exp.category}</span></td>
                <td>{exp.description}</td>
                <td style={{ fontWeight: 600, color: "#ef4444" }}>{formatUGX(exp.amount)}</td>
                <td><span className="badge badge-blue">{paymentLabels[exp.payment_method]}</span></td>
                <td>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => openEdit(exp)}>✏️</button>
                    <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => handleDelete(exp.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!expenses.length && <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No expenses yet.</p>}
      </div>
      {renderConfirm()}
    </div>
  );
}
