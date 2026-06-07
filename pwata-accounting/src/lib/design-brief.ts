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

export const SERVICE_FIELD_LABELS: Record<string, Record<string, string>> = {
  logo: {
    business_name: "Business Name",
    industry: "Industry",
    brand_personality: "Brand Personality",
    style_preference: "Style",
    color_preference: "Colors",
    intended_use: "Intended Use",
    reference_links: "Reference Links",
  },
  social: {
    platforms: "Platforms",
    post_type: "Post Type",
    content_text: "Content / Message",
    purpose: "Purpose",
    reference_accounts: "Reference Accounts",
    deadline: "Deadline",
  },
  print: {
    print_type: "Print Type",
    size: "Size",
    content_text: "Content / Message",
    style: "Style",
    color_scheme: "Color Scheme",
    print_quantity: "Quantity",
    deadline: "Deadline",
  },
  website: {
    business_name: "Business Name",
    industry: "Industry",
    website_purpose: "Purpose",
    target_audience: "Target Audience",
    brand_status: "Brand Status",
    domain_status: "Domain Status",
    preferred_features: "Preferred Features",
    reference_sites: "Reference Sites",
    content_ready: "Content Ready",
    deadline: "Deadline",
  },
  bot: {
    business_name: "Business Name",
    industry: "Industry",
    bot_purpose: "Purpose",
    conversation_complexity: "Complexity",
    whatsapp_business_status: "WhatsApp Business",
    has_telegram_channel: "Telegram Channel",
    integrations_needed: "Integrations",
    languages: "Languages",
    approx_monthly_messages: "Expected Volume",
    example_questions: "Example Questions",
    deadline: "Deadline",
  },
  merchandise: {
    color: "Color",
    size: "Size",
    print_text: "Print Text",
    style: "Style",
    color_scheme: "Color Scheme",
    placement: "Placement",
    inspiration: "Inspiration",
    notes: "Notes",
  },
};

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function renderCustomizations(
  serviceType: string,
  customizations: Record<string, unknown> | null | undefined
): string {
  if (!customizations) return "";
  const labels = SERVICE_FIELD_LABELS[serviceType] ?? {};
  const lines: string[] = [];
  for (const [key, value] of Object.entries(customizations)) {
    const formatted = formatFieldValue(value);
    if (!formatted) continue;
    const label = labels[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    lines.push(`${label}: ${formatted}`);
  }
  return lines.join("\n");
}

export function hasAnyContent(
  customizations: Record<string, unknown> | string | null | undefined
): boolean {
  if (!customizations) return false;
  let obj: Record<string, unknown>;
  if (typeof customizations === "string") {
    try { obj = JSON.parse(customizations); } catch { return false; }
  } else {
    obj = customizations;
  }
  return Object.values(obj).some((v) => {
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
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
