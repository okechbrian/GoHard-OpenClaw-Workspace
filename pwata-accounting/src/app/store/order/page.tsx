"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CartItem } from "@/app/store/page";
import { STYLES, COLOR_SCHEMES, PLACEMENTS, briefCompleteness, type DesignBrief } from "@/lib/design-brief";

function formatUGX(n: number) {
  return `UGX ${n.toLocaleString("en-UG")}`;
}

const COLOR_SCHEME_SWATCHES: Record<string, { bg: string; label: string }> = {
  "Black & White": { bg: "#1e1e1e", label: "B&W" },
  "Orange":        { bg: "#f97316", label: "" },
  "Blue":          { bg: "#3b82f6", label: "" },
  "Red":           { bg: "#ef4444", label: "" },
  "Gold":          { bg: "#eab308", label: "" },
  "Green":         { bg: "#22c55e", label: "" },
  "Multi-color":   { bg: "conic-gradient(red,yellow,green,blue,red)", label: "🎨" },
};

function StepIndicator({ current }: { current: number }) {
  const steps = ["Cart", "Design", "Details", "Pay", "Done"];
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

interface BriefState {
  print_text: string;
  style: string;
  color_scheme: string;
  placement: string;
  inspiration: string;
}

function BriefCard({
  item,
  idx,
  brief,
  onChange,
}: {
  item: CartItem;
  idx: number;
  brief: BriefState;
  onChange: (idx: number, patch: Partial<BriefState>) => void;
}) {
  return (
    <div className="brief-card">
      <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.75rem" }}>
        {item.quantity}× {item.product_name}
        {(item.color || item.size) && (
          <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.375rem" }}>
            ({[item.color, item.size].filter(Boolean).join(", ")})
          </span>
        )}
      </p>

      <div className="form-group">
        <label className="label">What should be printed? *</label>
        <input
          className="input"
          placeholder='e.g. "Kizibazi FC · Est 2019"'
          value={brief.print_text}
          onChange={(e) => onChange(idx, { print_text: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="label">Design style</label>
        <div className="style-pills">
          {STYLES.map((s) => (
            <button
              key={s}
              className={`style-pill${brief.style === s ? " selected" : ""}`}
              onClick={() => onChange(idx, { style: brief.style === s ? "" : s })}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Color scheme</label>
        <div className="color-swatches">
          {COLOR_SCHEMES.map((cs) => {
            const swatch = COLOR_SCHEME_SWATCHES[cs];
            return (
              <button
                key={cs}
                title={cs}
                className={`color-dot${brief.color_scheme === cs ? " selected" : ""}`}
                style={{ background: swatch?.bg ?? "#888" }}
                onClick={() => onChange(idx, { color_scheme: brief.color_scheme === cs ? "" : cs })}
                type="button"
              >
                {swatch?.label ?? ""}
              </button>
            );
          })}
        </div>
        {brief.color_scheme && (
          <p style={{ fontSize: "0.7rem", color: "var(--primary)", marginTop: "0.25rem" }}>{brief.color_scheme}</p>
        )}
      </div>

      <div className="form-group">
        <label className="label">Print placement</label>
        <div className="placement-pills">
          {PLACEMENTS.map((pl) => (
            <button
              key={pl}
              className={`placement-pill${brief.placement === pl ? " selected" : ""}`}
              onClick={() => onChange(idx, { placement: brief.placement === pl ? "" : pl })}
              type="button"
            >
              {pl}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="label">Inspiration / reference (optional)</label>
        <input
          className="input"
          placeholder="Describe a style or logo you like"
          value={brief.inspiration}
          onChange={(e) => onChange(idx, { inspiration: e.target.value })}
        />
      </div>
    </div>
  );
}

function BriefStrength({ cart, briefs }: { cart: CartItem[]; briefs: BriefState[] }) {
  const allBriefs: DesignBrief[] = briefs.map((b) => ({
    print_text: b.print_text || undefined,
    style: b.style || undefined,
    color_scheme: b.color_scheme || undefined,
    placement: b.placement || undefined,
    inspiration: b.inspiration || undefined,
  }));
  const scores = allBriefs.map((b) => briefCompleteness(b));
  const overall = scores.every((s) => s === "complete") ? "complete" : scores.every((s) => s === "minimal") ? "minimal" : "good";

  const filled = overall === "complete" ? 3 : overall === "good" ? 2 : 1;
  const isComplete = overall === "complete";

  const tips: Record<string, string> = {
    minimal: "add style + placement for best results",
    good: "add inspiration to help the designer",
    complete: "your brief is complete!",
  };

  return (
    <div className="brief-strength">
      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Brief strength:</span>
      <div className="brief-strength-bar">
        {[1, 2, 3].map((seg) => (
          <div
            key={seg}
            className={`brief-strength-segment${seg <= filled ? (isComplete ? " filled-complete" : " filled") : ""}`}
          />
        ))}
      </div>
      <span style={{ color: isComplete ? "var(--success)" : filled >= 2 ? "var(--primary)" : "var(--text-muted)", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
        {overall === "complete" ? "Complete ✓" : overall === "good" ? "Good" : "Minimal"} — {tips[overall]}
      </span>
    </div>
  );
}

export default function StoreOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [briefs, setBriefs] = useState<BriefState[]>([]);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Step 3 state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Step 4 state
  const [momoPhone, setMomoPhone] = useState("");
  const [network, setNetwork] = useState<"MTN" | "AIRTEL">("MTN");
  const [submitting, setSubmitting] = useState(false);

  // Step 5 state
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
        else {
          setCart(parsed);
          setBriefs(parsed.map(() => ({ print_text: "", style: "", color_scheme: "", placement: "", inspiration: "" })));
        }
      } catch {
        router.replace("/store");
      }
    } else {
      router.replace("/store");
    }
  }, [router]);

  useEffect(() => {
    if (step === 3 && phone) setMomoPhone(phone);
    if (step === 4) setMomoPhone((p) => p || phone);
  }, [step, phone]);

  useEffect(() => {
    if (step !== 5 || !orderId) return;
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
          setStep(4);
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
      setBriefs((pb) => pb.filter((_, i) => i !== idx));
      return updated;
    });
  };

  const patchBrief = (idx: number, patch: Partial<BriefState>) => {
    setBriefs((prev) => prev.map((b, i) => i === idx ? { ...b, ...patch } : b));
  };

  const handlePay = async () => {
    if (submitting) return;
    setSubmitting(true);
    setStep(5);
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
          deadline_date: deadlineDate || undefined,
          notes: orderNotes.trim() || undefined,
          items: cart.map((it, idx) => ({
            product_id: it.product_id,
            quantity: it.quantity,
            customizations: {
              color: it.color,
              size: it.size,
              print_text: briefs[idx]?.print_text || undefined,
              style: briefs[idx]?.style || undefined,
              color_scheme: briefs[idx]?.color_scheme || undefined,
              placement: briefs[idx]?.placement || undefined,
              inspiration: briefs[idx]?.inspiration || undefined,
            },
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
      setStep(4);
    }
  };

  if (!cart.length && step < 5) {
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
            Continue to Design Brief →
          </button>
        </div>
      )}

      {/* STEP 2 — Design Brief */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>🎨 Design Brief</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Tell our designers exactly what you want printed
          </p>

          {cart.map((it, idx) => (
            <BriefCard
              key={idx}
              item={it}
              idx={idx}
              brief={briefs[idx] ?? { print_text: "", style: "", color_scheme: "", placement: "", inspiration: "" }}
              onChange={patchBrief}
            />
          ))}

          <div className="form-group">
            <label className="label">When do you need this by? (optional)</label>
            <input
              className="input"
              type="date"
              value={deadlineDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">Anything else for the design team? (optional)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. Keep it minimal, no clipart please"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {briefs.length > 0 && <BriefStrength cart={cart} briefs={briefs} />}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} onClick={() => setStep(3)}>
              Continue to Details →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Details */}
      {step === 3 && (
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
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep(2)}>← Back</button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, justifyContent: "center" }}
              onClick={() => {
                if (!name.trim()) { toast.error("Name is required"); return; }
                if (!phone.trim()) { toast.error("Phone number is required"); return; }
                if (!address.trim()) { toast.error("Delivery address is required"); return; }
                setMomoPhone(phone.trim());
                setStep(4);
              }}
            >
              Continue to Payment →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Review & Pay */}
      {step === 4 && (
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
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep(3)}>← Back</button>
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

      {/* STEP 5 — Processing */}
      {step === 5 && (
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
