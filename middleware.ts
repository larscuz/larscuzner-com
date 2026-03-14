import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const sessionCookie = "cms_admin_session";

function isValidToken(token: string | undefined) {
  return token === (process.env.ADMIN_SESSION_SECRET || "local-dev-secret");
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookie)?.value;

  if (isValidToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
