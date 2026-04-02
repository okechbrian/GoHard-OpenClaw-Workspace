import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("pwata_user");
  if (!cookie) {
    return NextResponse.json({ authenticated: false });
  }
  try {
    const user = JSON.parse(cookie.value);
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
