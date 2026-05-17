import type { LogoBriefState } from "@/components/brief/LogoBrief";
import type { SocialBriefState } from "@/components/brief/SocialBrief";
import type { PrintBriefState } from "@/components/brief/PrintBrief";
import type { WebsiteBriefState } from "@/components/brief/WebsiteBrief";
import type { BotBriefState } from "@/components/brief/BotBrief";
import { PRINT_PACKAGE_MAP } from "./services";

export interface OrderItem {
  product_id: string;
  quantity: number;
  customizations: Record<string, unknown>;
}

export function logoToOrderItems(brief: LogoBriefState): OrderItem[] {
  return [{
    product_id: brief.package_id,
    quantity: 1,
    customizations: {
      business_name: brief.business_name,
      industry: brief.industry,
      brand_personality: brief.brand_personality,
      style_preference: brief.style_preference,
      color_preference: brief.color_preference,
      intended_use: brief.intended_use,
      reference_links: brief.reference_links,
    },
  }];
}

export function socialToOrderItems(brief: SocialBriefState): OrderItem[] {
  return [{
    product_id: brief.package_id,
    quantity: brief.number_of_designs || 1,
    customizations: {
      platforms: brief.platforms,
      post_type: brief.post_type,
      content_text: brief.content_text,
      purpose: brief.purpose,
      reference_accounts: brief.reference_accounts,
      deadline: brief.deadline,
    },
  }];
}

export function printToOrderItems(brief: PrintBriefState): OrderItem[] {
  const pkg = PRINT_PACKAGE_MAP[brief.print_type ?? "Flyer"] ?? { id: "svc_print_flyer", price: 35000 };
  return [{
    product_id: pkg.id,
    quantity: 1,
    customizations: {
      print_type: brief.print_type,
      size: brief.size,
      content_text: brief.content_text,
      style: brief.style,
      color_scheme: brief.color_scheme,
      print_quantity: brief.print_quantity,
      deadline: brief.deadline,
    },
  }];
}

export interface MerchCartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  color?: string;
  size?: string;
  print_text?: string;
  style?: string;
  color_scheme?: string;
  placement?: string;
  inspiration?: string;
}

export function websiteToOrderItems(brief: WebsiteBriefState): OrderItem[] {
  return [{
    product_id: brief.package_id,
    quantity: 1,
    customizations: {
      business_name: brief.business_name,
      industry: brief.industry,
      website_purpose: brief.website_purpose,
      target_audience: brief.target_audience,
      brand_status: brief.brand_status,
      domain_status: brief.domain_status,
      preferred_features: brief.preferred_features,
      reference_sites: brief.reference_sites,
      content_ready: brief.content_ready,
      deadline: brief.deadline,
    },
  }];
}

export function botToOrderItems(brief: BotBriefState): OrderItem[] {
  return [{
    product_id: brief.package_id,
    quantity: 1,
    customizations: {
      business_name: brief.business_name,
      industry: brief.industry,
      bot_purpose: brief.bot_purpose,
      conversation_complexity: brief.conversation_complexity,
      whatsapp_business_status: brief.whatsapp_business_status,
      has_telegram_channel: brief.has_telegram_channel,
      integrations_needed: brief.integrations_needed,
      languages: brief.languages,
      approx_monthly_messages: brief.approx_monthly_messages,
      example_questions: brief.example_questions,
      deadline: brief.deadline,
    },
  }];
}

export function merchToOrderItems(cart: MerchCartItem[]): OrderItem[] {
  return cart.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    customizations: {
      color: item.color,
      size: item.size,
      print_text: item.print_text,
      style: item.style,
      color_scheme: item.color_scheme,
      placement: item.placement,
      inspiration: item.inspiration,
    },
  }));
}
