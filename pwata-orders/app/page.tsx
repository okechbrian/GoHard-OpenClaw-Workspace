import ServiceCard from "@/components/ServiceCard";
import PlatformIcon from "@/components/PlatformIcon";
import { formatUGX } from "@/lib/services";

export default function Home() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "256775931342";
  return (
    <div className="container" style={{ paddingTop: "1.25rem" }}>
      {/* Hero */}
      <section className="hero">
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".4rem" }}>
          <img src="/logo.jpg" alt="" className="logo-img" style={{ width: 26, height: 26 }} />
          <span className="hero-eyebrow">Pwata Creatives</span>
        </div>
        <h1 className="hero-title">Order design that ships in days.</h1>
        <p className="hero-sub">
          Real designers, AI-assisted briefs. Pay 50% via MoMo, get drafts on WhatsApp, balance on delivery. No agency overhead.
        </p>
        <div className="hero-actions">
          <a href="#services" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>Browse services →</a>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="btn btn-ghost btn-lg" style={{ textDecoration: "none", color: "#25D366", borderColor: "rgba(37,211,102,.4)" }}>
            <PlatformIcon platform="WhatsApp" size={18} />
            <span>Talk to us</span>
          </a>
        </div>
        <div className="hero-trust">
          <span><strong>4.9★</strong> on WhatsApp</span>
          <span><strong>50+</strong> projects shipped</span>
          <span><strong>Same-day</strong> quotes</span>
        </div>
      </section>

      {/* Services */}
      <p id="services" className="section-head">Pick a service</p>
      <div className="service-grid">
        <ServiceCard service="merchandise" priceFrom={formatUGX(25000)} />
        <ServiceCard service="logo" priceFrom={formatUGX(80000)} />
        <ServiceCard service="social" priceFrom={formatUGX(60000)} />
        <ServiceCard service="print" priceFrom={formatUGX(25000)} />
      </div>

      {/* How it works */}
      <p className="section-head">How it works</p>
      <div className="flow">
        {[
          ["1", "Pick a service and fill the brief", "Tell us what you need, or let our AI assistant draft it from a sentence."],
          ["2", "Pay 50% via MoMo", "MTN or Airtel. We start work the moment payment clears."],
          ["3", "Updates on WhatsApp", "Drafts, revisions, and questions, all on the channel you already use."],
          ["4", "Pay balance on delivery", "Final files, prints, or merch in your hands. Then settle the rest."],
        ].map(([n, t, d]) => (
          <div key={n} className="flow-step">
            <span className="flow-num">{n}</span>
            <span className="flow-text"><strong>{t}.</strong> {d}</span>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <p className="section-head">Common questions</p>
      <div className="faq">
        <details>
          <summary>How fast can you deliver?</summary>
          <p>Logos: 2 to 4 days for first drafts. Social packs: 2 to 3 days. Flyers and merch designs: 1 to 2 days. Rush jobs are possible, message us first.</p>
        </details>
        <details>
          <summary>What if I don't like the first draft?</summary>
          <p>Every package includes 2 rounds of revisions. We work back-and-forth on WhatsApp until you're happy. Major direction changes count as a new brief.</p>
        </details>
        <details>
          <summary>Can I pay the full amount upfront?</summary>
          <p>Yes, just message us. The 50% deposit flow is the default to make things easier, but full payment, instalments, and split payments are all fine.</p>
        </details>
      </div>
    </div>
  );
}
