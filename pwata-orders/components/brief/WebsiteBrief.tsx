"use client";
import {
  WEBSITE_PACKAGES,
  WEBSITE_PURPOSES,
  WEBSITE_FEATURES,
  WEBSITE_CONTENT_READY,
  WEBSITE_DOMAIN_STATUS,
  WEBSITE_BRAND_STATUS,
} from "@/lib/services";
import PackageSelector from "@/components/PackageSelector";
import PillCluster from "@/components/PillCluster";

export interface WebsiteBriefState {
  package_id: string;
  business_name: string;
  industry: string;
  website_purpose: string;
  target_audience: string;
  page_count_estimate: string;
  brand_status: string;
  domain_status: string;
  preferred_features: string[];
  reference_sites: string;
  content_ready: string;
  deadline: string;
}

export const DEFAULT_WEBSITE_BRIEF: WebsiteBriefState = {
  package_id: "svc_website_landing",
  business_name: "", industry: "", website_purpose: "",
  target_audience: "", page_count_estimate: "",
  brand_status: "", domain_status: "",
  preferred_features: [], reference_sites: "",
  content_ready: "", deadline: "",
};

interface Props {
  brief: WebsiteBriefState;
  onChange: (b: WebsiteBriefState) => void;
}

export default function WebsiteBrief({ brief, onChange }: Props) {
  const set = <K extends keyof WebsiteBriefState>(k: K, v: WebsiteBriefState[K]) =>
    onChange({ ...brief, [k]: v });

  return (
    <div>
      <p className="section-head" style={{ marginTop: 0 }}>Choose a package</p>
      <PackageSelector
        packages={WEBSITE_PACKAGES}
        selected={brief.package_id}
        onSelect={(id) => set("package_id", id)}
      />

      <p className="section-head">Business basics</p>

      <div className="form-group">
        <label className="label">Business name *</label>
        <input className="input" placeholder="e.g. Kampala Catering Co." value={brief.business_name} onChange={(e) => set("business_name", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Industry / type of business</label>
        <input className="input" placeholder="e.g. Restaurant, NGO, Real estate, Tech" value={brief.industry} onChange={(e) => set("industry", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Who's the site for? (target audience)</label>
        <input className="input" placeholder="e.g. Wedding clients in Uganda, B2B buyers worldwide" value={brief.target_audience} onChange={(e) => set("target_audience", e.target.value)} />
      </div>

      <p className="section-head">Site direction</p>

      <div className="form-group">
        <label className="label">Main purpose *</label>
        <PillCluster
          options={WEBSITE_PURPOSES}
          selected={brief.website_purpose}
          onChange={(next) => set("website_purpose", next)}
        />
      </div>

      <div className="form-group">
        <label className="label">Features you want</label>
        <PillCluster
          options={WEBSITE_FEATURES}
          selected={brief.preferred_features}
          onChange={(next) => set("preferred_features", next)}
          multi
        />
      </div>

      <div className="form-group">
        <label className="label">Sites you like (for reference)</label>
        <textarea className="input" rows={2} placeholder="Paste 1–3 URLs you'd like us to take inspiration from" value={brief.reference_sites} onChange={(e) => set("reference_sites", e.target.value)} />
      </div>

      <p className="section-head">Logistics</p>

      <div className="form-group">
        <label className="label">Branding</label>
        <PillCluster
          options={WEBSITE_BRAND_STATUS}
          selected={brief.brand_status}
          onChange={(next) => set("brand_status", next)}
        />
      </div>

      <div className="form-group">
        <label className="label">Domain name</label>
        <PillCluster
          options={WEBSITE_DOMAIN_STATUS}
          selected={brief.domain_status}
          onChange={(next) => set("domain_status", next)}
        />
      </div>

      <div className="form-group">
        <label className="label">Content (text + images)</label>
        <PillCluster
          options={WEBSITE_CONTENT_READY}
          selected={brief.content_ready}
          onChange={(next) => set("content_ready", next)}
        />
      </div>

      <div className="form-group">
        <label className="label">Deadline (optional)</label>
        <input type="date" className="input" min={new Date().toISOString().split("T")[0]} value={brief.deadline} onChange={(e) => set("deadline", e.target.value)} />
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.6rem 0.8rem", background: "var(--bg-input)", borderRadius: 8, marginTop: "0.5rem" }}>
        Hosting on Vercel or Netlify is free for the first year. You'll register and own your own domain — we help point DNS to your site.
      </p>
    </div>
  );
}
