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
import PackageSelector from "@/components/PackageSelector";
import PillCluster from "@/components/PillCluster";

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

  return (
    <div>
      <p className="section-head" style={{ marginTop: 0 }}>Choose a package</p>
      <PackageSelector
        packages={BOT_PACKAGES}
        selected={brief.package_id}
        onSelect={(id) => set("package_id", id)}
      />

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
        <PillCluster
          options={BOT_PURPOSES}
          selected={brief.bot_purpose}
          onChange={(next) => set("bot_purpose", next)}
        />
      </div>

      <div className="form-group">
        <label className="label">Conversation style *</label>
        <PillCluster
          options={BOT_COMPLEXITIES}
          selected={brief.conversation_complexity}
          onChange={(next) => set("conversation_complexity", next)}
        />
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
        <PillCluster
          options={BOT_WHATSAPP_STATUS}
          selected={brief.whatsapp_business_status}
          onChange={(next) => set("whatsapp_business_status", next)}
        />
      </div>

      <div className="form-group">
        <label className="label">Integrations needed</label>
        <PillCluster
          options={BOT_INTEGRATIONS}
          selected={brief.integrations_needed}
          onChange={(next) => set("integrations_needed", next)}
          multi
        />
      </div>

      <div className="form-group">
        <label className="label">Languages</label>
        <PillCluster
          options={BOT_LANGUAGES}
          selected={brief.languages}
          onChange={(next) => set("languages", next)}
          multi
        />
      </div>

      <div className="form-group">
        <label className="label">Expected message volume (per month)</label>
        <PillCluster
          options={BOT_VOLUMES}
          selected={brief.approx_monthly_messages}
          onChange={(next) => set("approx_monthly_messages", next)}
        />
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
