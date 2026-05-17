export const ADMIN_ALLOWLIST = [
  "okechbrian@gmail.com",
  "kisakyecindy3@gmail.com",
] as const;

export const SESSION_COOKIE = "pwata_user";
export const OAUTH_STATE_COOKIE = "pwata_oauth_state";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

const enc = new TextEncoder();

export function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return enc.encode(secret);
}

export function getBaseUrl(): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getRedirectUri(): string {
  return `${getBaseUrl()}/api/auth/callback/google`;
}

export function isAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_ALLOWLIST.includes(email.toLowerCase() as typeof ADMIN_ALLOWLIST[number]);
}
