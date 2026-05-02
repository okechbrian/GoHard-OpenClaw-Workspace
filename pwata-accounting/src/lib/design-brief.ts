export const STYLES = ["Minimal", "Bold", "Street", "Classic", "Corporate", "Vintage"] as const;
export const COLOR_SCHEMES = ["Black & White", "Orange", "Blue", "Red", "Gold", "Green", "Multi-color"] as const;
export const PLACEMENTS = ["Chest Left", "Full Front", "Full Back", "Sleeve", "Front + Back"] as const;

export interface DesignBrief {
  print_text?: string;
  style?: string;
  color_scheme?: string;
  placement?: string;
  inspiration?: string;
  color?: string;
  size?: string;
  notes?: string;
}

export function briefToText(productName: string, qty: number, brief: DesignBrief): string {
  const lines = [`${qty}× ${productName}`];
  if (brief.color || brief.size) lines.push(`  Options: ${[brief.color, brief.size].filter(Boolean).join(", ")}`);
  if (brief.print_text) lines.push(`  Text: "${brief.print_text}"`);
  if (brief.style) lines.push(`  Style: ${brief.style}`);
  if (brief.color_scheme) lines.push(`  Colors: ${brief.color_scheme}`);
  if (brief.placement) lines.push(`  Placement: ${brief.placement}`);
  if (brief.inspiration) lines.push(`  Inspiration: ${brief.inspiration}`);
  if (brief.notes && !brief.print_text) lines.push(`  Notes: ${brief.notes}`);
  return lines.join("\n");
}

export function briefCompleteness(brief: DesignBrief): "minimal" | "good" | "complete" {
  const scored = [brief.print_text, brief.style, brief.color_scheme, brief.placement, brief.inspiration];
  const filled = scored.filter(Boolean).length;
  if (filled >= 4) return "complete";
  if (filled >= 2) return "good";
  return "minimal";
}
