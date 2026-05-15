export type ServiceType = "merchandise" | "logo" | "social" | "print";

export interface ServicePackage {
  id: string;
  label: string;
  price: number;
  description: string;
}

export const SERVICE_META: Record<ServiceType, { label: string; tagline: string; accent: string }> = {
  merchandise: { label: "Merchandise", tagline: "T-shirts, hoodies, mugs, caps & more",      accent: "#ff7b00" },
  logo:        { label: "Logo & Branding", tagline: "Logo design, brand identity, guidelines", accent: "#f43f5e" },
  social:      { label: "Social Media",    tagline: "Instagram, Facebook, LinkedIn graphics",  accent: "#22c55e" },
  print:       { label: "Print & Flyers",  tagline: "Flyers, menus, business cards, posters",  accent: "#f59e0b" },
};

export const LOGO_PACKAGES: ServicePackage[] = [
  { id: "svc_logo_basic", label: "Logo Only", price: 80000, description: "Custom logo mark" },
  { id: "svc_logo_brand", label: "Logo + Guide", price: 150000, description: "Logo + color & font guide" },
  { id: "svc_logo_full", label: "Full Identity", price: 280000, description: "Complete brand package" },
];

export const SOCIAL_PACKAGES: ServicePackage[] = [
  { id: "svc_social_basic", label: "5-Post Pack", price: 60000, description: "5 social media graphics" },
  { id: "svc_social_full", label: "10-Post Pack", price: 100000, description: "10 social media graphics" },
];

export const PRINT_PACKAGE_MAP: Record<string, { id: string; price: number }> = {
  "Flyer":          { id: "svc_print_flyer", price: 35000 },
  "Poster":         { id: "svc_print_flyer", price: 35000 },
  "Certificate":    { id: "svc_print_flyer", price: 35000 },
  "Business Card":  { id: "svc_print_card",  price: 25000 },
  "Menu":           { id: "svc_print_menu",  price: 55000 },
  "Brochure":       { id: "svc_print_menu",  price: 55000 },
  "Banner":         { id: "svc_print_menu",  price: 55000 },
};

export const LOGO_STYLES = ["Modern", "Vintage", "Minimalist", "Bold", "Playful", "Corporate"] as const;
export const LOGO_USES = ["Digital Only", "Print Only", "Both"] as const;
export const SOCIAL_PLATFORMS = ["Instagram", "Facebook", "Twitter/X", "LinkedIn", "TikTok"] as const;
export const SOCIAL_POST_TYPES = ["Regular Post", "Story/Reel Cover", "Profile Pic", "Cover Photo", "Carousel"] as const;
export const SOCIAL_PURPOSES = ["Promotion", "Announcement", "Regular Content", "Event"] as const;
export const PRINT_TYPES = ["Flyer", "Poster", "Menu", "Business Card", "Certificate", "Brochure", "Banner"] as const;
export const PRINT_SIZES = ["A4", "A3", "A5", "Square", "Custom"] as const;
export const PRINT_STYLES = ["Modern", "Classic", "Vibrant", "Minimal", "Luxury"] as const;
export const MERCH_STYLES = ["Minimal", "Bold", "Street", "Classic", "Corporate", "Vintage"] as const;
export const MERCH_COLORS = [
  { label: "Black & White", bg: "#1e293b", text: "BW" },
  { label: "Orange", bg: "#f97316", text: "" },
  { label: "Blue", bg: "#3b82f6", text: "" },
  { label: "Red", bg: "#ef4444", text: "" },
  { label: "Gold", bg: "#eab308", text: "" },
  { label: "Green", bg: "#22c55e", text: "" },
  { label: "Multi-color", bg: "linear-gradient(135deg,#f97316,#3b82f6,#22c55e)", text: "M" },
] as const;
export const MERCH_PLACEMENTS = ["Chest Left", "Full Front", "Full Back", "Sleeve", "Front + Back"] as const;

export function formatUGX(n: number) {
  return "UGX " + n.toLocaleString("en-UG");
}
