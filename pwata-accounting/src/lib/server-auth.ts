import type { NextRequest } from "next/server";
import sqlite from "@/lib/db";

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
      const row = sqlite.prepare(
        "SELECT id, name, email, role FROM users WHERE id = ?"
      ).get(payload.id) as SessionUser | undefined;
      if (row) return row;
    }
    if (payload.email) {
      const row = sqlite.prepare(
        "SELECT id, name, email, role FROM users WHERE email = ?"
      ).get(payload.email) as SessionUser | undefined;
      if (row) return row;
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
