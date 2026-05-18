"use client";
import { LOGO_STYLES, LOGO_USES, LOGO_PACKAGES } from "@/lib/services";
import PackageSelector from "@/components/PackageSelector";
import PillCluster from "@/components/PillCluster";

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
      <p className="section-head" style={{ marginTop: 0 }}>Choose a package</p>
      <PackageSelector
        packages={LOGO_PACKAGES}
        selected={brief.package_id}
        onSelect={(id) => set("package_id", id)}
      />

      <p className="section-head">Business basics</p>

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

      <p className="section-head">Style direction</p>

      <div className="form-group">
        <label className="label">Style preference</label>
        <PillCluster
          options={LOGO_STYLES}
          selected={brief.style_preference}
          onChange={(next) => set("style_preference", next)}
        />
      </div>

      <div className="form-group">
        <label className="label">Intended use</label>
        <PillCluster
          options={LOGO_USES}
          selected={brief.intended_use}
          onChange={(next) => set("intended_use", next)}
        />
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
