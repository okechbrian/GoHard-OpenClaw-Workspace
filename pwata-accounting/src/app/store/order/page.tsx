"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CartItem } from "@/app/store/page";

function formatUGX(n: number) {
  return `UGX ${n.toLocaleString("en-UG")}`;
}

function StepIndicator({ current }: { current: number }) {
  const steps = ["Cart", "Details", "Pay", "Processing"];
  return (
    <div className="step-indicator">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = current > num;
        const active = current === num;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && <div className={`step-line${done || active ? " done" : ""}`} />}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
              <div className={`step-dot${done ? " done" : active ? " active" : ""}`}>
                {done ? "✓" : num}
              </div>
              <span style={{ fontSize: "0.6rem", color: active ? "var(--primary)" : "var(--text-muted)", fontWeight: active ? 700 : 400 }}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StoreOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Step 2 state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Step 3 state
  const [momoPhone, setMomoPhone] = useState("");
  const [network, setNetwork] = useState<"MTN" | "AIRTEL">("MTN");
  const [submitting, setSubmitting] = useState(false);

  // Step 4 state
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("pwata_cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CartItem[];
        if (!parsed.length) router.replace("/store");
        else setCart(parsed);
      } catch {
        router.replace("/store");
      }
    } else {
      router.replace("/store");
    }
  }, [router]);

  useEffect(() => {
    if (step === 2 && phone) setMomoPhone(phone);
    if (step === 3) setMomoPhone((p) => p || phone);
  }, [step, phone]);

  // Polling for payment confirmation
  useEffect(() => {
    if (step !== 4 || !orderId) return;

    pollCount.current = 0;
    pollTimer.current = setInterval(async () => {
      pollCount.current += 1;
      if (pollCount.current > 100) {
        clearInterval(pollTimer.current!);
        setPollTimedOut(true);
        return;
      }
      try {
        const res = await fetch(`/api/store/orders/${orderId}`);
        const data = await res.json();
        if (data.payment_status === "partial" || data.payment_status === "paid") {
          clearInterval(pollTimer.current!);
          sessionStorage.removeItem("pwata_cart");
          router.push(`/store/order/${orderId}`);
        } else if (data.payment_status === "failed") {
          clearInterval(pollTimer.current!);
          toast.error("Payment failed. Please try again.");
          setSubmitting(false);
          setStep(3);
        }
      } catch { /* ignore network blips */ }
    }, 3000);

    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [step, orderId, router]);

  const cartTotal = cart.reduce((s, it) => s + (it.base_price + it.print_fee) * it.quantity, 0);
  const depositCalc = Math.ceil(cartTotal * 0.5);

  const updateQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const updated = prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it);
      sessionStorage.setItem("pwata_cart", JSON.stringify(updated));
      return updated;
    });
  };

  const removeItem = (idx: number) => {
    setCart((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      if (!updated.length) router.replace("/store");
      sessionStorage.setItem("pwata_cart", JSON.stringify(updated));
      return updated;
    });
  };

  const handlePay = async () => {
    if (submitting) return;
    setSubmitting(true);
    setStep(4);

    try {
      const orderRes = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: name.trim(),
          guest_phone: phone.trim(),
          guest_email: email.trim() || undefined,
          delivery_address: address.trim(),
          momo_network: network,
          items: cart.map((it) => ({
            product_id: it.product_id,
            quantity: it.quantity,
            customizations: { color: it.color, size: it.size, notes: it.notes },
          })),
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || "Order creation failed");
      }

      const orderData = await orderRes.json();
      setOrderId(orderData.id);
      setOrderNumber(orderData.order_number);
      setDepositAmount(orderData.deposit_amount);
      setTotalAmount(orderData.total_amount);

      const payRes = await fetch("/api/store/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderData.id,
          phone_number: momoPhone.trim(),
          network,
          customer_name: name.trim(),
          customer_email: email.trim() || undefined,
        }),
      });

      if (!payRes.ok) {
        const err = await payRes.json();
        throw new Error(err.error || "Payment initiation failed");
      }

    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
      setStep(3);
    }
  };

  if (!cart.length && step < 4) {
    return <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading…</div>;
  }

  return (
    <div>
      <StepIndicator current={step} />

      {/* STEP 1 — Cart */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Your Cart</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
            {cart.map((it, idx) => (
              <div key={idx} className="card" style={{ padding: "0.75rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                {it.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image_url} alt={it.product_name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div style={{ width: 56, height: 56, background: "var(--bg)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>📦</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{it.product_name}</p>
                  {(it.color || it.size) && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {[it.color, it.size].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {it.notes && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{it.notes}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.375rem" }}>
                    <button onClick={() => updateQty(idx, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text)", cursor: "pointer" }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{it.quantity}</span>
                    <button onClick={() => updateQty(idx, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text)", cursor: "pointer" }}>+</button>
                    <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: "0.875rem" }}>{formatUGX((it.base_price + it.print_fee) * it.quantity)}</span>
                  </div>
                </div>
                {cart.length > 1 && (
                  <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", padding: "0.25rem" }}>🗑</button>
                )}
              </div>
            ))}
          </div>

          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 600 }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#22c55e" }}>{formatUGX(cartTotal)}</span>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setStep(2)}>
            Continue to Details →
          </button>
        </div>
      )}

      {/* STEP 2 — Details */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Your Details</h2>
          <div className="form-group">
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Phone Number *</label>
            <input className="input" type="tel" placeholder="+256 700 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Email (optional)</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Delivery Address *</label>
            <textarea className="input" rows={3} placeholder="e.g. Plot 12, Kampala Road, Kampala" value={address} onChange={(e) => setAddress(e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep(1)}>← Back</button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, justifyContent: "center" }}
              onClick={() => {
                if (!name.trim()) { toast.error("Name is required"); return; }
                if (!phone.trim()) { toast.error("Phone number is required"); return; }
                if (!address.trim()) { toast.error("Delivery address is required"); return; }
                setMomoPhone(phone.trim());
                setStep(3);
              }}
            >
              Continue to Payment →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Review & Pay */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Review & Pay</h2>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order Summary</h3>
            {cart.map((it, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", padding: "0.25rem 0", borderBottom: "1px solid rgba(71,85,105,0.2)" }}>
                <span>{it.quantity}× {it.product_name}{it.color ? ` (${it.color}${it.size ? `, ${it.size}` : ""})` : ""}</span>
                <span style={{ fontWeight: 600 }}>{formatUGX((it.base_price + it.print_fee) * it.quantity)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1rem", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
              <span>Grand Total</span>
              <span style={{ color: "#22c55e" }}>{formatUGX(cartTotal)}</span>
            </div>
          </div>

          <div className="deposit-callout">
            <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem" }}>💳 50% Deposit Required</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)", marginBottom: "0.25rem" }}>{formatUGX(depositCalc)}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Balance {formatUGX(cartTotal - depositCalc)} due on delivery</div>
          </div>

          <div className="form-group">
            <label className="label">MoMo Phone Number</label>
            <input className="input" type="tel" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} placeholder="+256 700 000 000" />
          </div>

          <div className="form-group">
            <label className="label">Select Network</label>
            <div className="network-pills">
              <button className={`network-pill${network === "MTN" ? " selected" : ""}`} onClick={() => setNetwork("MTN")}>
                📱 MTN MoMo
              </button>
              <button className={`network-pill${network === "AIRTEL" ? " selected" : ""}`} onClick={() => setNetwork("AIRTEL")}>
                📡 Airtel Money
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep(2)}>← Back</button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, justifyContent: "center" }}
              disabled={submitting}
              onClick={() => {
                if (!momoPhone.trim()) { toast.error("Enter your MoMo phone number"); return; }
                handlePay();
              }}
            >
              {submitting ? "Processing…" : `Pay ${formatUGX(depositCalc)} Deposit`}
            </button>
          </div>

          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.75rem" }}>
            You will receive a payment prompt on your phone
          </p>
        </div>
      )}

      {/* STEP 4 — Processing */}
      {step === 4 && (
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          {!pollTimedOut ? (
            <>
              <div className="spinner" style={{ margin: "0 auto 1.5rem" }} />
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Check your phone 📱</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                A payment prompt has been sent to <strong>{momoPhone}</strong>.<br />
                Enter your {network === "MTN" ? "MTN MoMo" : "Airtel Money"} PIN to confirm.
              </p>
              {orderNumber && (
                <div className="card" style={{ display: "inline-block", padding: "0.75rem 1.25rem", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Order Number</p>
                  <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--primary)" }}>{orderNumber}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Deposit: {formatUGX(depositAmount)}</p>
                </div>
              )}
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>This may take up to 2 minutes…</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⏳</div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Still processing…</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                Your payment may still go through. Bookmark the link below to check your order status:
              </p>
              {orderId && (
                <a href={`/store/order/${orderId}`} style={{ color: "var(--primary)", fontWeight: 600, wordBreak: "break-all" }}>
                  {typeof window !== "undefined" ? window.location.origin : ""}/store/order/{orderId}
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
