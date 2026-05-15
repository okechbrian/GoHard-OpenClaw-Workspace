import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CookieUserPayload {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

export async function getCurrentUser(request: NextRequest): Promise<SessionUser | null> {
  const cookie = request.cookies.get("pwata_user");
  if (!cookie) return null;

  let payload: CookieUserPayload;
  try {
    payload = JSON.parse(cookie.value);
  } catch {
    return null;
  }

  try {
    if (payload.id) {
      const rows = await sql`
        SELECT id, name, email, role FROM users WHERE id = ${payload.id}
      ` as SessionUser[];
      if (rows[0]) return rows[0];
    }
    if (payload.email) {
      const rows = await sql`
        SELECT id, name, email, role FROM users WHERE email = ${payload.email}
      ` as SessionUser[];
      if (rows[0]) return rows[0];
    }
  } catch {
    // fall through to cookie payload
  }

  if (payload.id && payload.email && payload.name) {
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role ?? "user",
    };
  }
  return null;
}
