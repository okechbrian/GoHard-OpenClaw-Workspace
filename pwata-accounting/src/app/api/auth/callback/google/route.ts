import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { sql } from "@/lib/db";
import { generateId } from "@/lib/utils";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  getBaseUrl,
  getRedirectUri,
  getSecretKey,
  isAllowlisted,
} from "@/lib/auth-config";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

interface GoogleIdTokenClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE);

  const denied = (reason: string) => {
    const res = NextResponse.redirect(`${getBaseUrl()}/login?denied=${reason}`);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  };

  if (!code || !state || !stateCookie) return denied("state");

  let stateData: { state: string; verifier: string };
  try {
    stateData = JSON.parse(stateCookie.value);
  } catch {
    return denied("state");
  }
  if (stateData.state !== state) return denied("state");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return denied("config");

  // Exchange code for tokens.
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: stateData.verifier,
    }),
  });
  if (!tokenRes.ok) {
    console.error("Google token exchange failed:", await tokenRes.text());
    return denied("exchange");
  }
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) return denied("exchange");

  // Validate ID token against Google's JWKS.
  let claims: GoogleIdTokenClaims;
  try {
    const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });
    claims = payload as unknown as GoogleIdTokenClaims;
  } catch (err) {
    console.error("ID token validation failed:", err);
    return denied("token");
  }

  if (!claims.email_verified) return denied("unverified");
  if (!isAllowlisted(claims.email)) return denied("1");

  // Upsert user.
  const newId = generateId();
  const rows = (await sql`
    INSERT INTO users (id, name, email, google_id, picture_url, role)
    VALUES (${newId}, ${claims.name ?? claims.email}, ${claims.email}, ${claims.sub}, ${claims.picture ?? null}, 'admin')
    ON CONFLICT (email) DO UPDATE
      SET google_id = EXCLUDED.google_id,
          picture_url = EXCLUDED.picture_url,
          name = EXCLUDED.name
    RETURNING id, name, email, role
  `) as Array<{ id: string; name: string; email: string; role: string }>;
  const user = rows[0];

  // Issue session JWT.
  const jwt = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    picture: claims.picture ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());

  const response = NextResponse.redirect(`${getBaseUrl()}/`);
  response.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
