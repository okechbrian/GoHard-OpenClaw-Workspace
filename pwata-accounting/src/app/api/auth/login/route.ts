import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, name, email, password_hash, role FROM users WHERE email = ${email}
    ` as Array<{ id: string; name: string; email: string; password_hash: string; role: string }>;
    const dbUser = rows[0];

    if (!dbUser || !bcrypt.compareSync(password, dbUser.password_hash)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };

    const response = NextResponse.json({ success: true, user });
    response.cookies.set("pwata_user", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("pwata_user");
  return response;
}
