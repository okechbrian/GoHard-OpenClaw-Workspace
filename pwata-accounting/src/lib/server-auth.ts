import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { sql } from "@/lib/db";
import { SESSION_COOKIE, getSecretKey } from "@/lib/auth-config";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SessionPayload extends SessionUser {
  picture: string | null;
}

export async function getSessionPayload(request: NextRequest): Promise<SessionPayload | null> {
  const cookie = request.cookies.get(SESSION_COOKIE);
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie.value, getSecretKey());
    if (!payload.sub || !payload.email) return null;
    return {
      id: String(payload.sub),
      name: String(payload.name ?? ""),
      email: String(payload.email),
      role: String(payload.role ?? "user"),
      picture: payload.picture ? String(payload.picture) : null,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(request: NextRequest): Promise<SessionUser | null> {
  const session = await getSessionPayload(request);
  if (!session) return null;

  try {
    const rows = (await sql`
      SELECT id, name, email, role FROM users WHERE id = ${session.id}
    `) as SessionUser[];
    if (rows[0]) return rows[0];
  } catch {
    // fall through to JWT-payload-only result
  }

  return { id: session.id, name: session.name, email: session.email, role: session.role };
}
