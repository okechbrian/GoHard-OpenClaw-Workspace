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
          Real designers, AI-assisted briefs. Send us your idea, we quote on WhatsApp, you pay 50% to start. Drafts on WhatsApp, balance on delivery. No agency overhead.
        </p>
        <div className="hero-actions">
          <a href="#services" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>Browse services →</a>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="btn btn-ghost btn-lg" style={{ textDecoration: "none", color: "#25D366", borderColor: "rgba(37,211,102,.4)" }}>
            <PlatformIcon platform="WhatsApp" size={18} />
            <span>Talk to us</span>
          </a>
        </div>
      </section>

      {/* Services */}
      <p id="services" className="section-head">Pick a service</p>
      <div className="service-grid">
        <ServiceCard service="logo" priceFrom={formatUGX(80000)} />
        <ServiceCard service="social" priceFrom={formatUGX(60000)} />
        <ServiceCard service="print" priceFrom={formatUGX(25000)} />
        <ServiceCard service="website" priceFrom={formatUGX(350000)} />
        <ServiceCard service="bot" priceFrom={formatUGX(400000)} />
      </div>

      {/* How it works */}
      <p className="section-head">How it works</p>
      <div className="flow">
        {[
          ["1", "Pick a service and fill the brief", "Tell us what you need, or let our AI assistant draft it from a sentence."],
          ["2", "We reach out on WhatsApp", "We confirm the quote and arrange the 50% deposit on MTN MoMo or Airtel Money."],
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
          <summary>How do I pay?</summary>
          <p>After you submit your brief, we follow up on WhatsApp with the final quote and our MoMo merchant code (MTN or Airtel). 50% deposit starts the work, balance on delivery. Full payment upfront and instalments are also fine.</p>
        </details>
        <details>
          <summary>Do I need to download anything?</summary>
          <p>No. Everything happens on WhatsApp and through this site. No apps to install, no accounts to create.</p>
        </details>
      </div>
    </div>
  );
}
