"use client";
import { PRINT_TYPES, PRINT_SIZES, PRINT_STYLES, PRINT_PACKAGE_MAP, formatUGX } from "@/lib/services";
import PillCluster from "@/components/PillCluster";

export interface PrintBriefState {
  print_type: string;
  size: string;
  content_text: string;
  style: string;
  color_scheme: string;
  print_quantity: number;
  deadline: string;
}

export const DEFAULT_PRINT_BRIEF: PrintBriefState = {
  print_type: "", size: "A4", content_text: "", style: "",
  color_scheme: "", print_quantity: 0, deadline: "",
};

interface Props {
  brief: PrintBriefState;
  onChange: (b: PrintBriefState) => void;
}

export default function PrintBrief({ brief, onChange }: Props) {
  const set = (k: keyof PrintBriefState, v: unknown) => onChange({ ...brief, [k]: v });
  const pkg = brief.print_type ? PRINT_PACKAGE_MAP[brief.print_type] : null;

  return (
    <div>
      <p className="section-head" style={{ marginTop: 0 }}>What we're making</p>

      <div className="form-group">
        <label className="label">What do you need designed? *</label>
        <PillCluster
          options={PRINT_TYPES}
          selected={brief.print_type}
          onChange={(next) => set("print_type", next)}
        />
        {pkg && (
          <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--primary)" }}>
            Design fee: {formatUGX(pkg.price)} (50% deposit = {formatUGX(Math.ceil(pkg.price * 0.5))})
          </p>
        )}
      </div>

      <div className="form-group">
        <label className="label">Size / format</label>
        <PillCluster
          options={PRINT_SIZES}
          selected={brief.size}
          onChange={(next) => set("size", next || "A4")}
        />
      </div>

      <p className="section-head">Content & style</p>

      <div className="form-group">
        <label className="label">All content / text to include *</label>
        <textarea className="input" rows={4}
          placeholder="Paste everything that should appear: headings, body text, contact info, website, slogan..."
          value={brief.content_text}
          onChange={(e) => set("content_text", e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="label">Style</label>
        <PillCluster
          options={PRINT_STYLES}
          selected={brief.style}
          onChange={(next) => set("style", next)}
        />
      </div>

      <div className="form-group">
        <label className="label">Color scheme</label>
        <input className="input" placeholder="e.g. Blue and white, company brand colors" value={brief.color_scheme} onChange={(e) => set("color_scheme", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Print quantity (how many copies?)</label>
        <input type="number" min={0} className="input" style={{ maxWidth: 140 }}
          placeholder="e.g. 500"
          value={brief.print_quantity || ""}
          onChange={(e) => set("print_quantity", parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="form-group">
        <label className="label">Deadline</label>
        <input type="date" className="input" min={new Date().toISOString().split("T")[0]} value={brief.deadline} onChange={(e) => set("deadline", e.target.value)} />
      </div>
    </div>
  );
}
