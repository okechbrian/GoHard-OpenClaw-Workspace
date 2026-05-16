"use client";
import { SOCIAL_PACKAGES, SOCIAL_PLATFORMS, SOCIAL_POST_TYPES, SOCIAL_PURPOSES } from "@/lib/services";
import PlatformIcon from "@/components/PlatformIcon";

export interface SocialBriefState {
  package_id: string;
  platforms: string[];
  post_type: string;
  number_of_designs: number;
  content_text: string;
  purpose: string;
  reference_accounts: string;
  deadline: string;
}

export const DEFAULT_SOCIAL_BRIEF: SocialBriefState = {
  package_id: "svc_social_basic",
  platforms: [], post_type: "", number_of_designs: 5,
  content_text: "", purpose: "", reference_accounts: "", deadline: "",
};

interface Props {
  brief: SocialBriefState;
  onChange: (b: SocialBriefState) => void;
}

export default function SocialBrief({ brief, onChange }: Props) {
  const set = (k: keyof SocialBriefState, v: unknown) => onChange({ ...brief, [k]: v });

  const togglePlatform = (p: string) => {
    const next = brief.platforms.includes(p)
      ? brief.platforms.filter((x) => x !== p)
      : [...brief.platforms, p];
    set("platforms", next);
  };

  const updateDesigns = (n: number) => {
    const pkg_id = n > 5 ? "svc_social_full" : "svc_social_basic";
    onChange({ ...brief, number_of_designs: n, package_id: pkg_id });
  };

  const selectedPkg = SOCIAL_PACKAGES.find((p) => p.id === brief.package_id) ?? SOCIAL_PACKAGES[0];

  return (
    <div>
      <p className="section-head" style={{ marginTop: 0 }}>Where will it run?</p>

      <div className="form-group">
        <label className="label">Platforms *</label>
        <div className="style-pills">
          {SOCIAL_PLATFORMS.map((p) => (
            <button key={p} type="button"
              className={`style-pill platform-pill${brief.platforms.includes(p) ? " multi-selected" : ""}`}
              onClick={() => togglePlatform(p)}
            >
              <PlatformIcon platform={p} size={14} />
              <span>{p}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Post type</label>
        <div className="style-pills">
          {SOCIAL_POST_TYPES.map((t) => (
            <button key={t} type="button"
              className={`style-pill${brief.post_type === t ? " selected" : ""}`}
              onClick={() => set("post_type", brief.post_type === t ? "" : t)}
            >{t}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Number of designs</label>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <input
            type="number" min={1} max={50} className="input" style={{ maxWidth: 100 }}
            value={brief.number_of_designs}
            onChange={(e) => updateDesigns(parseInt(e.target.value) || 1)}
          />
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Package: <strong style={{ color: "var(--primary)" }}>{selectedPkg.label} · UGX {selectedPkg.price.toLocaleString("en-UG")}</strong>
          </span>
        </div>
      </div>

      <p className="section-head">Content & purpose</p>

      <div className="form-group">
        <label className="label">Content / text to include *</label>
        <textarea className="input" rows={3}
          placeholder="Paste the text, captions, or key info you want on the graphics"
          value={brief.content_text}
          onChange={(e) => set("content_text", e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="label">Purpose</label>
        <div className="style-pills">
          {SOCIAL_PURPOSES.map((p) => (
            <button key={p} type="button"
              className={`style-pill${brief.purpose === p ? " selected" : ""}`}
              onClick={() => set("purpose", brief.purpose === p ? "" : p)}
            >{p}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Accounts you want the style to feel like</label>
        <input className="input" placeholder="e.g. @adidasUganda, @KCCAgov" value={brief.reference_accounts} onChange={(e) => set("reference_accounts", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Deadline *</label>
        <input type="date" className="input" min={new Date().toISOString().split("T")[0]} value={brief.deadline} onChange={(e) => set("deadline", e.target.value)} />
      </div>
    </div>
  );
}
