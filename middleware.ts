import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/checkout", "/cart", "/product", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasCookie = req.cookies.get("cd_test")?.value === "1";
  if (hasCookie) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/test";
  return NextResponse.redirect(url);
}

// Run middleware only on these routes (more efficient)
export const config = {
  matcher: ["/checkout/:path*", "/cart/:path*", "/product/:path*", "/admin/:path*"],
};

