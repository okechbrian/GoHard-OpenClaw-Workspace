"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { formatUGX } from "@/lib/utils";
import SearchableSelect from "@/components/SearchableSelect";
import OrderSummaryBar from "@/components/OrderSummaryBar";

interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  print_fee: number;
  variants: string | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface LineItem {
  product_id: string;
  quantity: number;
  customizations: string;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mtn_momo", label: "MTN MoMo" },
  { value: "airtel_money", label: "Airtel Money" },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [customerType, setCustomerType] = useState<"existing" | "guest">("guest");
  const [customerId, setCustomerId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [items, setItems] = useState<LineItem[]>([{ product_id: "", quantity: 1, customizations: "" }]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => toast.error("Failed to load products"));
    fetch("/api/customers").then((r) => r.json()).then(setCustomers).catch(() => toast.error("Failed to load customers"));
  }, []);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const addItem = () => setItems([...items, { product_id: "", quantity: 1, customizations: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<LineItem>) => {
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const itemTotal = (it: LineItem) => {
    const p = productMap.get(it.product_id);
    if (!p) return 0;
    return (p.base_price + p.print_fee) * (it.quantity || 0);
  };

  const grandTotal = items.reduce((sum, it) => sum + itemTotal(it), 0);
  const validItemCount = items.filter((it) => it.product_id && it.quantity > 0).length;

  const customerOptions = customers.map((c) => ({
    id: c.id,
    label: c.name,
    sublabel: c.phone ?? undefined,
  }));

  const productOptions = products.map((p) => ({
    id: p.id,
    label: p.name,
    sublabel: p.category,
    meta: formatUGX(p.base_price + p.print_fee),
  }));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const validItems = items.filter((it) => it.product_id && it.quantity > 0);
    if (!validItems.length) return toast.error("Add at least one item with quantity ≥ 1");
    if (!deliveryAddress.trim()) return toast.error("Delivery address is required");

    const payload: Record<string, unknown> = {
      items: validItems.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        customizations: it.customizations ? { notes: it.customizations } : {},
      })),
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      notes: notes || null,
    };

    if (customerType === "existing") {
      if (!customerId) return toast.error("Select a customer");
      payload.customer_id = customerId;
    } else {
      if (!guestName.trim() || !guestPhone.trim()) return toast.error("Guest name and phone are required");
      payload.guest_name = guestName;
      payload.guest_phone = guestPhone;
      if (guestEmail) payload.guest_email = guestEmail;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const order = await res.json();
        toast.success(`Order ${order.order_number} created`);
        router.push(`/orders/${order.id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create order");
        setSubmitting(false);
      }
    } catch {
      toast.error("Network error");
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: validItemCount > 0 ? "150px" : "2rem" }}>
      <header style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>New Order</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Create a custom merchandise order</p>
        </div>
        <Link href="/orders" className="btn btn-ghost">← Back</Link>
      </header>

      <form onSubmit={handleSubmit}>
        {/* Customer */}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Customer</h2>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <button type="button" className={customerType === "guest" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setCustomerType("guest")}>Guest</button>
            <button type="button" className={customerType === "existing" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setCustomerType("existing")}>Existing</button>
          </div>

          {customerType === "existing" ? (
            <div className="form-group">
              <label className="label">Customer *</label>
              <SearchableSelect
                value={customerId}
                onChange={setCustomerId}
                options={customerOptions}
                placeholder="Pick a customer"
                searchPlaceholder="Search by name or phone..."
                emptyText="No customers match"
                onCreateNew={() => router.push("/customers")}
                createNewLabel="+ Add a new customer"
              />
            </div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Guest Name *</label>
                  <input className="input" placeholder="Jane Doe" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Phone *</label>
                  <input className="input" placeholder="+256 700 000 000" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Email (optional)</label>
                <input className="input" type="email" placeholder="jane@example.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
              </div>
            </>
          )}
        </div>

        {/* Items */}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Items</h2>
            <button type="button" className="btn btn-ghost" onClick={addItem}>+ Add Item</button>
          </div>

          {items.map((it, i) => {
            const p = productMap.get(it.product_id);
            return (
              <div key={i} style={{ paddingBottom: "0.75rem", marginBottom: "0.75rem", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : undefined }}>
                <div className="form-group">
                  <label className="label">Product</label>
                  <SearchableSelect
                    value={it.product_id}
                    onChange={(id) => updateItem(i, { product_id: id })}
                    options={productOptions}
                    placeholder="Pick a product"
                    searchPlaceholder="Search products..."
                    emptyText="No products match"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Quantity</label>
                    <input className="input" type="number" min="1" value={it.quantity} onChange={(e) => updateItem(i, { quantity: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="label">Customizations</label>
                    <input className="input" placeholder="e.g. Red, size M, logo top-left" value={it.customizations} onChange={(e) => updateItem(i, { customizations: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>
                    {p ? `${formatUGX(p.base_price + p.print_fee)} × ${it.quantity}` : "Pick a product"}
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{formatUGX(itemTotal(it))}</span>
                    {items.length > 1 && (
                      <button type="button" className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => removeItem(i)}>🗑️</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery & payment */}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Delivery & Payment</h2>
          <div className="form-group">
            <label className="label">Delivery Address *</label>
            <textarea className="input" rows={2} placeholder="Plot 12, Kampala Rd, Kampala" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Payment Method *</label>
            <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={2} placeholder="Anything the production team should know" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <Link href="/orders" className="btn btn-ghost">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create Order"}
          </button>
        </div>
      </form>

      <OrderSummaryBar
        itemCount={validItemCount}
        subtotal={grandTotal}
        showDeposit={false}
        variant="sticky"
        primaryAction={{
          label: submitting ? "..." : "Create order",
          onClick: () => handleSubmit(),
          disabled: submitting || validItemCount === 0,
          loading: submitting,
        }}
      />
    </div>
  );
}
