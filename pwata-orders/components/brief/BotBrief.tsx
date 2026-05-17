"use client";
import {
  BOT_PACKAGES,
  BOT_PURPOSES,
  BOT_COMPLEXITIES,
  BOT_INTEGRATIONS,
  BOT_LANGUAGES,
  BOT_VOLUMES,
  BOT_WHATSAPP_STATUS,
} from "@/lib/services";

export interface BotBriefState {
  package_id: string;
  business_name: string;
  industry: string;
  bot_purpose: string;
  conversation_complexity: string;
  whatsapp_business_status: string;
  has_telegram_channel: boolean;
  integrations_needed: string[];
  languages: string[];
  approx_monthly_messages: string;
  example_questions: string;
  deadline: string;
}

export const DEFAULT_BOT_BRIEF: BotBriefState = {
  package_id: "svc_bot_faq",
  business_name: "", industry: "", bot_purpose: "",
  conversation_complexity: "",
  whatsapp_business_status: "", has_telegram_channel: false,
  integrations_needed: [], languages: ["English"],
  approx_monthly_messages: "",
  example_questions: "", deadline: "",
};

interface Props {
  brief: BotBriefState;
  onChange: (b: BotBriefState) => void;
}

export default function BotBrief({ brief, onChange }: Props) {
  const set = <K extends keyof BotBriefState>(k: K, v: BotBriefState[K]) =>
    onChange({ ...brief, [k]: v });

  const toggleArr = (k: "integrations_needed" | "languages", v: string) => {
    const current = brief[k];
    const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
    set(k, next);
  };

  return (
    <div>
      <p className="section-head" style={{ marginTop: 0 }}>Choose a package</p>
      <div className="package-grid">
        {BOT_PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            className={`package-card${brief.package_id === pkg.id ? " selected" : ""}`}
            onClick={() => set("package_id", pkg.id)}
            type="button"
          >
            <div className="package-name">{pkg.label}</div>
            <div className="package-price">UGX {pkg.price.toLocaleString("en-UG")}</div>
            <div className="package-desc">{pkg.description}</div>
          </button>
        ))}
      </div>

      <p className="section-head">Business basics</p>

      <div className="form-group">
        <label className="label">Business name *</label>
        <input className="input" placeholder="e.g. Kasozi Pharmacy" value={brief.business_name} onChange={(e) => set("business_name", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Industry / type of business</label>
        <input className="input" placeholder="e.g. Pharmacy, real estate, school, e-commerce" value={brief.industry} onChange={(e) => set("industry", e.target.value)} />
      </div>

      <p className="section-head">What should the bot do?</p>

      <div className="form-group">
        <label className="label">Main purpose *</label>
        <div className="style-pills">
          {BOT_PURPOSES.map((p) => (
            <button key={p} type="button"
              className={`style-pill${brief.bot_purpose === p ? " selected" : ""}`}
              onClick={() => set("bot_purpose", brief.bot_purpose === p ? "" : p)}
            >{p}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Conversation style *</label>
        <div className="style-pills">
          {BOT_COMPLEXITIES.map((c) => (
            <button key={c} type="button"
              className={`style-pill${brief.conversation_complexity === c ? " selected" : ""}`}
              onClick={() => set("conversation_complexity", brief.conversation_complexity === c ? "" : c)}
            >{c}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Sample questions / requests the bot should handle</label>
        <textarea className="input" rows={3} inputMode="text"
          placeholder='e.g. "What time do you open?" / "Do you deliver to Ntinda?" / "I want to refill my prescription"'
          value={brief.example_questions}
          onChange={(e) => set("example_questions", e.target.value)}
        />
      </div>

      <p className="section-head">Platforms & integrations</p>

      <div className="form-group">
        <label className="label">WhatsApp Business account</label>
        <div className="style-pills">
          {BOT_WHATSAPP_STATUS.map((w) => (
            <button key={w} type="button"
              className={`style-pill${brief.whatsapp_business_status === w ? " selected" : ""}`}
              onClick={() => set("whatsapp_business_status", brief.whatsapp_business_status === w ? "" : w)}
            >{w}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Integrations needed</label>
        <div className="style-pills">
          {BOT_INTEGRATIONS.map((i) => (
            <button key={i} type="button"
              className={`style-pill${brief.integrations_needed.includes(i) ? " multi-selected" : ""}`}
              onClick={() => toggleArr("integrations_needed", i)}
            >{i}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Languages</label>
        <div className="style-pills">
          {BOT_LANGUAGES.map((l) => (
            <button key={l} type="button"
              className={`style-pill${brief.languages.includes(l) ? " multi-selected" : ""}`}
              onClick={() => toggleArr("languages", l)}
            >{l}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Expected message volume (per month)</label>
        <div className="style-pills">
          {BOT_VOLUMES.map((v) => (
            <button key={v} type="button"
              className={`style-pill${brief.approx_monthly_messages === v ? " selected" : ""}`}
              onClick={() => set("approx_monthly_messages", brief.approx_monthly_messages === v ? "" : v)}
            >{v}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Deadline (optional)</label>
        <input type="date" className="input" min={new Date().toISOString().split("T")[0]} value={brief.deadline} onChange={(e) => set("deadline", e.target.value)} />
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.6rem 0.8rem", background: "var(--bg-input)", borderRadius: 8, marginTop: "0.5rem" }}>
        Telegram is 100% free to run. WhatsApp Business API has per-conversation pricing — you pay Meta directly; we handle the build and setup.
      </p>
    </div>
  );
}
