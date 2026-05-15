"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ServiceType } from "@/lib/services";
import { SERVICE_META, formatUGX } from "@/lib/services";
import LogoBrief, { DEFAULT_LOGO_BRIEF, type LogoBriefState } from "@/components/brief/LogoBrief";
import SocialBrief, { DEFAULT_SOCIAL_BRIEF, type SocialBriefState } from "@/components/brief/SocialBrief";
import PrintBrief, { DEFAULT_PRINT_BRIEF, type PrintBriefState } from "@/components/brief/PrintBrief";
import MerchBrief from "@/components/brief/MerchBrief";
import AIBriefAssistant from "@/components/AIBriefAssistant";
import type { MerchCartItem } from "@/lib/brief-helpers";
import { logoToOrderItems, socialToOrderItems, printToOrderItems, merchToOrderItems } from "@/lib/brief-helpers";
import { LOGO_PACKAGES, SOCIAL_PACKAGES, PRINT_PACKAGE_MAP } from "@/lib/services";

const VALID_SERVICES: ServiceType[] = ["merchandise", "logo", "social", "print"];

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0")) return "256" + digits.slice(1);
  return "256" + digits;
}

export default function OrderPage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = use(params);
  const router = useRouter();

  const serviceType = VALID_SERVICES.includes(service as ServiceType)
    ? (service as ServiceType)
    : null;

  // Brief state
  const [logoBrief, setLogoBrief] = useState<LogoBriefState>(DEFAULT_LOGO_BRIEF);
  const [socialBrief, setSocialBrief] = useState<SocialBriefState>(DEFAULT_SOCIAL_BRIEF);
  const [printBrief, setPrintBrief] = useState<PrintBriefState>(DEFAULT_PRINT_BRIEF);
  const [merchCart, setMerchCart] = useState<MerchCartItem[]>([]);

  // Customer details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [momoNetwork, setMomoNetwork] = useState<"MTN" | "AIRTEL">("MTN");

  // Wizard state
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  if (!serviceType) {
    return (
      <div className="container" style={{ paddingTop: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Service not found.</p>
        <a href="/" className="btn btn-primary" style={{ display: "inline-flex", marginTop: "1rem", textDecoration: "none" }}>Go back</a>
      </div>
    );
  }

  const meta = SERVICE_META[serviceType];

  // Calculate estimated total for review step
  function getEstimatedTotal(): number {
    if (serviceType === "logo") {
      return LOGO_PACKAGES.find((p) => p.id === logoBrief.package_id)?.price ?? 80000;
    }
    if (serviceType === "social") {
      return SOCIAL_PACKAGES.find((p) => p.id === socialBrief.package_id)?.price ?? 60000;
    }
    if (serviceType === "print") {
      const pkg = PRINT_PACKAGE_MAP[printBrief.print_type ?? "Flyer"];
      return pkg?.price ?? 35000;
    }
    // merch: sum from cart items
    return merchCart.reduce((s, c) => s + c.unit_price * c.quantity, 0);
  }

  function getItems() {
    if (serviceType === "logo") return logoToOrderItems(logoBrief);
    if (serviceType === "social") return socialToOrderItems(socialBrief);
    if (serviceType === "print") return printToOrderItems(printBrief);
    return merchToOrderItems(merchCart);
  }

  function isBriefValid(): boolean {
    if (serviceType === "logo") return !!logoBrief.business_name.trim();
    if (serviceType === "social") return socialBrief.platforms.length > 0 && !!socialBrief.content_text.trim();
    if (serviceType === "print") return !!printBrief.print_type && !!printBrief.content_text.trim();
    return merchCart.length > 0 && merchCart.every((c) => !!c.print_text?.trim());
  }

  function isDetailsValid(): boolean {
    if (!name.trim() || !phone.trim()) return false;
    if (serviceType === "merchandise" && !address.trim()) return false;
    return true;
  }

  function handleAIFill(fields: Record<string, unknown>) {
    if (serviceType === "logo") setLogoBrief((b) => ({ ...b, ...fields }));
    if (serviceType === "social") setSocialBrief((b) => ({ ...b, ...fields }));
    if (serviceType === "print") setPrintBrief((b) => ({ ...b, ...fields }));
    toast.success("Brief filled! Review and adjust as needed.");
  }

  async function handlePay() {
    setProcessing(true);
    setPaymentError("");

    const items = getItems();
    const momoPhone = normalizePhone(whatsapp || phone);

    try {
      // Create order
      let createdId = orderId;
      if (!createdId) {
        const orderRes = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guest_name: name.trim(),
            guest_phone: normalizePhone(phone),
            guest_email: email.trim() || undefined,
            delivery_address: serviceType === "merchandise" ? address.trim() : undefined,
            notes: notes.trim() || undefined,
            items,
            momo_network: momoNetwork,
            service_type: serviceType === "merchandise" ? "merchandise" : "digital",
          }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error ?? "Failed to create order");
        createdId = orderData.id;
        setOrderId(createdId);
        setOrderNumber(orderData.order_number);
        setDepositAmount(orderData.deposit_amount);
        setTotalAmount(orderData.total_amount);
      }

      // Initiate payment
      const payRes = await fetch("/api/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: createdId,
          phone_number: momoPhone,
          network: momoNetwork,
          customer_name: name.trim(),
          customer_email: email.trim() || undefined,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error ?? "Payment initiation failed");

      // Poll for status
      setStep(4);
      let polls = 0;
      const interval = setInterval(async () => {
        polls++;
        if (polls > 100) {
          clearInterval(interval);
          setProcessing(false);
          return;
        }
        const pollRes = await fetch(`/api/order-poll/${createdId}`);
        const pollData = await pollRes.json();
        if (pollData.payment_status === "partial" || pollData.payment_status === "paid") {
          clearInterval(interval);
          router.push(`/track/${createdId}`);
        } else if (pollData.payment_status === "failed") {
          clearInterval(interval);
          setProcessing(false);
          setPaymentError("Payment failed. Please try again.");
          setStep(3);
        }
      }, 3000);

    } catch (err: any) {
      setPaymentError(err.message ?? "Something went wrong.");
      setProcessing(false);
      setStep(3);
    }
  }

  const estimatedTotal = getEstimatedTotal();
  const estimatedDeposit = Math.ceil(estimatedTotal * 0.5);

  const stepLabels = ["Brief", "Details", "Review", "Payment"];
  const stepHeadings = [
    "Tell us about your project",
    "How can we reach you?",
    "Confirm & pay deposit",
    "Processing payment",
  ];
  const progressPct = Math.round(((step - 1) / 3) * 100);

  // Brief strength (0-3 filled segments)
  const briefStrength = (() => {
    if (serviceType === "logo") {
      const filled = [logoBrief.business_name, logoBrief.style_preference, logoBrief.intended_use, logoBrief.color_preference].filter((v) => v && String(v).trim()).length;
      return Math.min(3, filled);
    }
    if (serviceType === "social") {
      const filled = [socialBrief.platforms.length > 0, socialBrief.post_type, socialBrief.content_text, socialBrief.purpose, socialBrief.deadline].filter(Boolean).length;
      return Math.min(3, Math.floor(filled / 2) + (filled > 0 ? 1 : 0));
    }
    if (serviceType === "print") {
      const filled = [printBrief.print_type, printBrief.size, printBrief.content_text, printBrief.style, printBrief.color_scheme].filter((v) => v && String(v).trim()).length;
      return Math.min(3, Math.floor(filled / 2) + (filled > 0 ? 1 : 0));
    }
    // merch: 1 for items, 2 if all have print text, 3 if any have style+placement
    if (merchCart.length === 0) return 0;
    const allText = merchCart.every((c) => !!c.print_text?.trim());
    const anyStyled = merchCart.some((c) => !!c.style && !!c.placement);
    return 1 + (allText ? 1 : 0) + (anyStyled ? 1 : 0);
  })();

  return (
    <div className="container" style={{ paddingTop: "1rem" }}>
      {/* Service header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "1.25rem" }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: `${meta.accent}22`, color: meta.accent, fontWeight: 900, fontSize: ".95rem" }}>
          {meta.label[0]}
        </span>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.01em" }}>{meta.label}</h2>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{meta.tagline}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="step-indicator">
        {stepLabels.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                <div className={`step-dot${done ? " done" : active ? " active" : ""}`}>
                  {done ? "✓" : n}
                </div>
                <span style={{ fontSize: "0.6rem", color: active ? "var(--primary)" : "var(--text-muted)", fontWeight: 600 }}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && <div className={`step-line${done ? " done" : ""}`} style={{ margin: "0 0.375rem", marginBottom: "1rem" }} />}
            </div>
          );
        })}
      </div>

      {/* Step heading */}
      <p className="section-head">{stepHeadings[step - 1]}</p>

      {/* Step 1: Brief */}
      {step === 1 && (
        <>
          {serviceType === "logo" && <LogoBrief brief={logoBrief} onChange={setLogoBrief} />}
          {serviceType === "social" && <SocialBrief brief={socialBrief} onChange={setSocialBrief} />}
          {serviceType === "print" && <PrintBrief brief={printBrief} onChange={setPrintBrief} />}
          {serviceType === "merchandise" && <MerchBrief cart={merchCart} onChange={setMerchCart} />}

          {/* Brief strength meter */}
          <div className="brief-strength">
            <span className="brief-strength-label">
              Brief strength: <strong>{["Add more details", "Getting there", "Solid brief", "Excellent brief"][briefStrength]}</strong>
            </span>
            <div className="brief-strength-bar">
              {[0, 1, 2].map((i) => (
                <div key={i}
                  className={`brief-strength-segment${i < briefStrength ? (briefStrength === 3 ? " filled-complete" : " filled") : ""}`}
                />
              ))}
            </div>
          </div>

          <AIBriefAssistant serviceType={serviceType} onFill={handleAIFill} />
          <div className="sticky-cta">
            <div className="sticky-cta-inner" style={{ flexDirection: "column", gap: 0 }}>
              <div className="sticky-progress">Step <strong>{step}</strong> of 4 · {progressPct}% complete</div>
              <div style={{ display: "flex", gap: ".6rem", width: "100%" }}>
                <a href="/" className="btn btn-ghost" style={{ textDecoration: "none" }}>← Back</a>
                <button type="button" className="btn btn-primary btn-full btn-lg"
                  disabled={!isBriefValid()}
                  onClick={() => setStep(2)}>
                  Continue to details →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Step 2: Customer details */}
      {step === 2 && (
        <>
          <div className="form-group">
            <label className="label">Full name *</label>
            <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Phone number *</label>
            <input className="input" type="tel" placeholder="0700 000 000" value={phone}
              onChange={(e) => { setPhone(e.target.value); if (!whatsapp) setWhatsapp(e.target.value); }} />
          </div>
          <div className="form-group">
            <label className="label">WhatsApp number (for updates)</label>
            <input className="input" type="tel" placeholder="Same as above if identical" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>We'll send you design updates and proofs via WhatsApp.</p>
          </div>
          <div className="form-group">
            <label className="label">Email (optional)</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {serviceType === "merchandise" && (
            <div className="form-group">
              <label className="label">Delivery address *</label>
              <textarea className="input" rows={3} placeholder="Your address for delivery" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="label">Additional notes</label>
            <textarea className="input" rows={2} placeholder="Anything else we should know?" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Payment network</label>
            <div className="network-pills">
              {(["MTN", "AIRTEL"] as const).map((n) => (
                <button key={n} type="button"
                  className={`network-pill${momoNetwork === n ? " selected" : ""}`}
                  onClick={() => setMomoNetwork(n)}>
                  {n === "MTN" ? "MTN MoMo" : "Airtel Money"}
                </button>
              ))}
            </div>
          </div>
          <div className="sticky-cta">
            <div className="sticky-cta-inner" style={{ flexDirection: "column", gap: 0 }}>
              <div className="sticky-progress">Step <strong>{step}</strong> of 4 · {progressPct}% complete</div>
              <div style={{ display: "flex", gap: ".6rem", width: "100%" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="btn btn-primary btn-full btn-lg"
                  disabled={!isDetailsValid()}
                  onClick={() => setStep(3)}>
                  Review order →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Step 3: Review & pay */}
      {step === 3 && (
        <>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <p style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Order summary</p>
            {getItems().map((item, i) => {
              const label = item.customizations?.business_name
                || item.customizations?.print_type
                || item.customizations?.print_text
                || `Item ${i + 1}`;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", padding: "0.375rem 0", borderBottom: "1px solid var(--border)" }}>
                  <span>{String(label)} × {item.quantity}</span>
                </div>
              );
            })}
          </div>

          <div className="deposit-callout">
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>50% deposit to confirm order</p>
            <p style={{ fontSize: "2rem", fontWeight: 900, color: "var(--success)" }}>{formatUGX(estimatedDeposit)}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Balance {formatUGX(estimatedTotal - estimatedDeposit)} due on delivery/completion
            </p>
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Customer</span>
                <strong>{name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Phone</span>
                <strong>{phone}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Payment via</span>
                <strong>{momoNetwork === "MTN" ? "MTN MoMo" : "Airtel Money"}</strong>
              </div>
            </div>
          </div>

          {paymentError && (
            <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "0.75rem", padding: "0.75rem", background: "rgba(239,68,68,.1)", borderRadius: 8 }}>
              ⚠️ {paymentError}
            </p>
          )}

          <div className="sticky-cta">
            <div className="sticky-cta-inner" style={{ flexDirection: "column", gap: 0 }}>
              <div className="sticky-progress">Step <strong>{step}</strong> of 4 · {progressPct}% complete</div>
              <div style={{ display: "flex", gap: ".6rem", width: "100%" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button type="button" className="btn btn-primary btn-full btn-lg"
                  disabled={processing}
                  onClick={handlePay}>
                  {processing ? "Processing..." : `Pay ${formatUGX(estimatedDeposit)} deposit`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Step 4: Processing / polling */}
      {step === 4 && (
        <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <div className="spinner" style={{ marginBottom: "1.5rem" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Check your phone</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            A payment prompt has been sent to <strong>{whatsapp || phone}</strong>.<br />
            Enter your {momoNetwork === "MTN" ? "MTN MoMo" : "Airtel Money"} PIN to confirm.
          </p>
          {orderNumber && (
            <div className="card" style={{ display: "inline-block", textAlign: "center", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Order number</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 900 }}>{orderNumber}</p>
              <p style={{ fontSize: "0.875rem", color: "var(--primary)", fontWeight: 700 }}>Deposit: {formatUGX(depositAmount)}</p>
            </div>
          )}
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>This may take up to 2 minutes. Don't close this page.</p>
        </div>
      )}
    </div>
  );
}
