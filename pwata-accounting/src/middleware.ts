import { NextRequest, NextResponse } from "next/server";

// Set STORE_HOSTNAME in Vercel env vars — e.g. "pwata-store.vercel.app" or "store.pwata.ug"
const STORE_HOST = process.env.STORE_HOSTNAME ?? "";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  const isStoreDomain = STORE_HOST !== "" && host === STORE_HOST;

  if (isStoreDomain) {
    // Store API and upload pass through
    if (pathname.startsWith("/api/store") || pathname.startsWith("/api/upload")) {
      return NextResponse.next();
    }

    // All other /api/* calls are admin-only — block them
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // /store/* paths (client-side navigation lands here) — serve as-is
    if (pathname.startsWith("/store")) {
      return NextResponse.next();
    }

    // Root → rewrite to /store (customer sees "/" in browser, gets the store)
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/store";
      return NextResponse.rewrite(url);
    }

    // /order or /order/[id] → rewrite to /store equivalent
    if (pathname.startsWith("/order")) {
      const url = request.nextUrl.clone();
      url.pathname = "/store" + pathname;
      return NextResponse.rewrite(url);
    }

    // Any other path on store domain → back to store home
    const url = request.nextUrl.clone();
    url.pathname = "/store";
    return NextResponse.redirect(url);
  }

  // Admin domain: if STORE_HOST is configured, redirect /store/* to the store domain
  if (STORE_HOST !== "" && pathname.startsWith("/store")) {
    const url = request.nextUrl.clone();
    url.host = STORE_HOST;
    url.protocol = "https:";
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.jpg|manifest.json|images/).*)",
  ],
};
