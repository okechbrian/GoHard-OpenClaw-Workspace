import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import type { ServiceType } from "@/lib/services";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

const PROMPTS: Record<ServiceType, string> = {
  logo: `You are a design brief assistant for Pwata Creatives, a graphic design studio in Kampala, Uganda.
A customer will describe their logo or branding idea in plain language.
Extract structured brief fields from their description.

Return ONLY a valid JSON object with these exact keys (omit keys you cannot infer):
{
  "business_name": "string. the business name if mentioned",
  "industry": "string. the business sector or type",
  "brand_personality": "string. 3 descriptive words about brand feel",
  "style_preference": "one of: Modern | Vintage | Minimalist | Bold | Playful | Corporate",
  "color_preference": "string. suggested color direction",
  "intended_use": "one of: Digital Only | Print Only | Both",
  "reference_links": "string. any brands or logos mentioned as inspiration",
  "package_id": "one of: svc_logo_basic | svc_logo_brand | svc_logo_full. infer from complexity, default to svc_logo_basic"
}
Do not include markdown fences. Return raw JSON only.`,

  social: `You are a design brief assistant for Pwata Creatives, a graphic design studio in Kampala, Uganda.
A customer will describe their social media graphics need in plain language.
Extract structured brief fields.

Return ONLY a valid JSON object with these exact keys (omit keys you cannot infer):
{
  "platforms": ["array of: Instagram | Facebook | Twitter/X | LinkedIn | TikTok"],
  "post_type": "one of: Regular Post | Story/Reel Cover | Profile Pic | Cover Photo | Carousel",
  "number_of_designs": 5,
  "content_text": "string. any text the customer wants included",
  "purpose": "one of: Promotion | Announcement | Regular Content | Event",
  "reference_accounts": "string. any accounts or brands mentioned",
  "package_id": "one of: svc_social_basic | svc_social_full. use full if more than 5 designs"
}
Do not include markdown fences. Return raw JSON only.`,

  print: `You are a design brief assistant for Pwata Creatives, a graphic design studio in Kampala, Uganda.
A customer will describe their print design need in plain language.
Extract structured brief fields.

Return ONLY a valid JSON object with these exact keys (omit keys you cannot infer):
{
  "print_type": "one of: Flyer | Poster | Menu | Business Card | Certificate | Brochure | Banner",
  "size": "one of: A4 | A3 | A5 | Square | Custom",
  "content_text": "string. any text the customer wants included",
  "style": "one of: Modern | Classic | Vibrant | Minimal | Luxury",
  "color_scheme": "string. suggested colors",
  "print_quantity": 100,
  "deadline": "ISO date string YYYY-MM-DD if a timeline is mentioned, otherwise omit"
}
Do not include markdown fences. Return raw JSON only.`,

  merchandise: `You are a design brief assistant for Pwata Creatives, a graphic design studio in Kampala, Uganda.
A customer will describe what they want printed on a product.
Extract structured brief fields.

Return ONLY a valid JSON object with these exact keys (omit keys you cannot infer):
{
  "print_text": "string. the exact text or slogan to print",
  "style": "one of: Minimal | Bold | Street | Classic | Corporate | Vintage",
  "color_scheme": "one of: Black & White | Orange | Blue | Red | Gold | Green | Multi-color",
  "placement": "one of: Chest Left | Full Front | Full Back | Sleeve | Front + Back",
  "inspiration": "string. design inspiration or reference brands mentioned"
}
Do not include markdown fences. Return raw JSON only.`,

  website: `You are a website brief assistant for Pwata Creatives, a digital studio in Kampala, Uganda that builds websites.
A customer will describe their website need in plain language.
Extract structured brief fields.

Return ONLY a valid JSON object with these exact keys (omit keys you cannot infer):
{
  "business_name": "string. the business or project name",
  "industry": "string. e.g. Restaurant, NGO, Real estate, Tech startup",
  "website_purpose": "one of: Landing | Portfolio | Services / Business | E-commerce | Blog / Content | Other",
  "target_audience": "string. one short sentence about who the site is for",
  "preferred_features": ["array of: Contact form | WhatsApp button | Blog | Payments | Booking | Login / Members | Map | Gallery"],
  "reference_sites": "string. URLs or brand names they mentioned as inspiration",
  "content_ready": "one of: Yes, all ready | Some ready | Need help writing",
  "deadline": "ISO date YYYY-MM-DD if a timeline is mentioned, otherwise omit",
  "package_id": "one of: svc_website_landing | svc_website_multi | svc_website_full | svc_website_ecom. Infer: 1-page or 'simple' → svc_website_landing; 3-5 pages or 'a few pages' → svc_website_multi; CMS, blog, large site or 10+ pages → svc_website_full; online store, cart, checkout, products → svc_website_ecom. Default svc_website_landing."
}
Do not include markdown fences. Return raw JSON only.`,

  bot: `You are a chatbot brief assistant for Pwata Creatives, a digital studio in Kampala, Uganda that builds WhatsApp and Telegram bots (both platforms are bundled in every package).
A customer will describe their bot need in plain language.
Extract structured brief fields.

Return ONLY a valid JSON object with these exact keys (omit keys you cannot infer):
{
  "business_name": "string. the business or project name",
  "industry": "string. e.g. Pharmacy, school, real estate, restaurant",
  "bot_purpose": "one of: FAQ / info | Orders | Lead capture | Appointments | Broadcasts / announcements | Other",
  "conversation_complexity": "one of: Simple menu | Guided form | AI-powered. Infer: 'just FAQs' or 'menu' → Simple menu; 'capture data' or 'lead form' → Guided form; 'smart' or 'AI' or 'understand questions' → AI-powered",
  "whatsapp_business_status": "one of: I have a WhatsApp Business account | Not yet | I need help. If unclear, omit",
  "integrations_needed": ["array of: Google Sheets | Calendar | Payments | CRM | Email"],
  "languages": ["array of: English | Luganda | Swahili | Other"],
  "approx_monthly_messages": "one of: Under 1,000 / month | 1,000–10,000 / month | 10,000+ / month",
  "example_questions": "string. 1-3 short example queries the bot should handle, separated by line breaks",
  "deadline": "ISO date YYYY-MM-DD if mentioned, otherwise omit",
  "package_id": "one of: svc_bot_faq | svc_bot_intake | svc_bot_full. Infer: menu-only or static answers → svc_bot_faq; captures orders/leads or syncs to Sheets/email → svc_bot_intake; 'smart', 'AI', integrations, multilingual → svc_bot_full. Default svc_bot_faq."
}
Do not include markdown fences. Return raw JSON only.`,
};

export async function POST(request: NextRequest) {
  try {
    const { service_type, free_text } = await request.json() as { service_type: ServiceType; free_text: string };

    if (!free_text?.trim()) {
      return NextResponse.json({ ok: false, error: "No description provided" }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ ok: false, error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const systemInstruction = PROMPTS[service_type] ?? PROMPTS.logo;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Customer description: "${free_text.trim()}"\n\nReturn ONLY valid JSON. No explanation.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const raw = (response.text ?? "")
      .replace(/^```json?\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();

    const fields = JSON.parse(raw);
    return NextResponse.json({ ok: true, fields });
  } catch (err) {
    console.error("brief-assist error:", err);
    return NextResponse.json({ ok: false, error: "AI assistant unavailable" }, { status: 500 });
  }
}
