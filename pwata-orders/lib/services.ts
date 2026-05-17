export type ServiceType = "merchandise" | "logo" | "social" | "print" | "website" | "bot";

export interface ServicePackage {
  id: string;
  label: string;
  price: number;
  description: string;
}

export const SERVICE_META: Record<ServiceType, { label: string; tagline: string; accent: string }> = {
  merchandise: { label: "Merchandise",     tagline: "T-shirts, hoodies, mugs, caps & more",        accent: "#ff7b00" },
  logo:        { label: "Logo & Branding", tagline: "Logo design, brand identity, guidelines",     accent: "#f43f5e" },
  social:      { label: "Social Media",    tagline: "Instagram, Facebook, LinkedIn graphics",      accent: "#22c55e" },
  print:       { label: "Print & Flyers",  tagline: "Flyers, menus, business cards, posters",      accent: "#f59e0b" },
  website:     { label: "Websites",        tagline: "Landing pages, full sites, e-commerce stores", accent: "#6366f1" },
  bot:         { label: "WhatsApp + Telegram Bots", tagline: "FAQ, lead capture, AI conversation", accent: "#06b6d4" },
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

export const WEBSITE_PACKAGES: ServicePackage[] = [
  { id: "svc_website_landing", label: "Landing Page",       price:  350000, description: "1 page, contact form, mobile responsive, hosted on Vercel" },
  { id: "svc_website_multi",   label: "Multi-Page Website", price:  900000, description: "Up to 5 pages, CMS-lite, blog optional" },
  { id: "svc_website_full",    label: "Full Website + CMS", price: 2000000, description: "10+ pages, full CMS, blog, custom design" },
  { id: "svc_website_ecom",    label: "E-Commerce Store",   price: 2800000, description: "Catalog, cart, Flutterwave/MoMo checkout, admin" },
];

export const BOT_PACKAGES: ServicePackage[] = [
  { id: "svc_bot_faq",    label: "FAQ Bot",                price:  400000, description: "WhatsApp + Telegram, menu-driven, 5–10 nodes" },
  { id: "svc_bot_intake", label: "Intake / Lead Bot",      price:  750000, description: "Captures orders/leads, syncs to Sheets or email" },
  { id: "svc_bot_full",   label: "Full Conversational Bot", price: 1800000, description: "AI Q&A, integrations, multilingual" },
];

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

export const WEBSITE_PURPOSES = ["Landing", "Portfolio", "Services / Business", "E-commerce", "Blog / Content", "Other"] as const;
export const WEBSITE_FEATURES = ["Contact form", "WhatsApp button", "Blog", "Payments", "Booking", "Login / Members", "Map", "Gallery"] as const;
export const WEBSITE_CONTENT_READY = ["Yes, all ready", "Some ready", "Need help writing"] as const;
export const WEBSITE_DOMAIN_STATUS = ["I have one", "I'll register one", "I need help"] as const;
export const WEBSITE_BRAND_STATUS = ["I have one", "I need help with branding"] as const;

export const BOT_PURPOSES = ["FAQ / info", "Orders", "Lead capture", "Appointments", "Broadcasts / announcements", "Other"] as const;
export const BOT_COMPLEXITIES = ["Simple menu", "Guided form", "AI-powered"] as const;
export const BOT_INTEGRATIONS = ["Google Sheets", "Calendar", "Payments", "CRM", "Email"] as const;
export const BOT_LANGUAGES = ["English", "Luganda", "Swahili", "Other"] as const;
export const BOT_VOLUMES = ["Under 1,000 / month", "1,000–10,000 / month", "10,000+ / month"] as const;
export const BOT_WHATSAPP_STATUS = ["I have a WhatsApp Business account", "Not yet", "I need help"] as const;

export function formatUGX(n: number) {
  return "UGX " + n.toLocaleString("en-UG");
}
