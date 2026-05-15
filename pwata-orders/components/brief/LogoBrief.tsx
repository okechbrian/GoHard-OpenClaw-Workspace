"use client";
import { LOGO_STYLES, LOGO_USES, LOGO_PACKAGES } from "@/lib/services";

export interface LogoBriefState {
  package_id: string;
  business_name: string;
  industry: string;
  brand_personality: string;
  style_preference: string;
  color_preference: string;
  intended_use: string;
  reference_links: string;
}

export const DEFAULT_LOGO_BRIEF: LogoBriefState = {
  package_id: "svc_logo_basic",
  business_name: "", industry: "", brand_personality: "",
  style_preference: "", color_preference: "", intended_use: "", reference_links: "",
};

interface Props {
  brief: LogoBriefState;
  onChange: (b: LogoBriefState) => void;
}

export default function LogoBrief({ brief, onChange }: Props) {
  const set = (k: keyof LogoBriefState, v: string) => onChange({ ...brief, [k]: v });

  return (
    <div>
      <p className="label" style={{ marginBottom: "0.75rem" }}>Choose a package</p>
      <div className="package-grid">
        {LOGO_PACKAGES.map((pkg) => (
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

      <div className="form-group">
        <label className="label">Business name *</label>
        <input className="input" placeholder="e.g. Kizibazi FC" value={brief.business_name} onChange={(e) => set("business_name", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Industry / type of business</label>
        <input className="input" placeholder="e.g. Football club, Restaurant, Tech startup" value={brief.industry} onChange={(e) => set("industry", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Brand personality (3 words)</label>
        <input className="input" placeholder="e.g. Bold, energetic, youthful" value={brief.brand_personality} onChange={(e) => set("brand_personality", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Style preference</label>
        <div className="style-pills">
          {LOGO_STYLES.map((s) => (
            <button key={s} type="button"
              className={`style-pill${brief.style_preference === s ? " selected" : ""}`}
              onClick={() => set("style_preference", brief.style_preference === s ? "" : s)}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Intended use</label>
        <div className="style-pills">
          {LOGO_USES.map((u) => (
            <button key={u} type="button"
              className={`style-pill${brief.intended_use === u ? " selected" : ""}`}
              onClick={() => set("intended_use", brief.intended_use === u ? "" : u)}
            >{u}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Color preference</label>
        <input className="input" placeholder="e.g. Warm reds and black, avoid pastels" value={brief.color_preference} onChange={(e) => set("color_preference", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Brands / logos you like (inspiration)</label>
        <textarea className="input" rows={2} placeholder="e.g. Nike's simplicity, Manchester United's crest" value={brief.reference_links} onChange={(e) => set("reference_links", e.target.value)} />
      </div>
    </div>
  );
}
