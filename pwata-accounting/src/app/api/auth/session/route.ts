import { NextRequest, NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const session = await getSessionPayload(request);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      picture: session.picture,
    },
  });
}
