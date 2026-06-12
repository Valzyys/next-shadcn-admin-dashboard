import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/auth",
  "/api/auth",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lewati semua path public (auth pages + api auth)
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    const loginUrl = new URL("/auth/v2/login", req.url);
    // Simpan tujuan awal agar bisa redirect balik setelah login
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match semua path kecuali:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, robots, sitemap
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
