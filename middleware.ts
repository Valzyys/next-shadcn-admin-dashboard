import { type NextRequest, NextResponse } from "next/server";

import { fetchUpstream } from "@/lib/upstream";

const PUBLIC_PATHS = ["/auth", "/api/auth", "/api/gateway/token", "/api/proxy-image", "/api/gateway/auth"];

function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.exp ?? null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const exp = decodeJwtExp(token);
  if (!exp) return true;
  // Buffer 30 detik agar tidak expired pas di-forward ke gateway
  return Date.now() / 1000 >= exp - 30;
}

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  try {
    const res = await fetchUpstream("/gateway/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const result = await res.json();
    if (!result.status) return null;
    return result.data;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // Tidak ada token sama sekali → redirect login
  if (!accessToken && !refreshToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/auth/v2/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Access token masih valid → lanjut
  if (accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  // Access token expired tapi ada refresh token → coba refresh
  if (refreshToken && !isTokenExpired(refreshToken)) {
    const newTokens = await refreshAccessToken(refreshToken);
    if (newTokens) {
      // Lanjutkan request dan set cookie baru
      const requestHeaders = new Headers(req.headers);
      const updatedCookies = req.cookies
        .getAll()
        .filter(({ name }) => !["access_token", "refresh_token"].includes(name));
      updatedCookies.push({ name: "access_token", value: newTokens.access_token });
      updatedCookies.push({ name: "refresh_token", value: newTokens.refresh_token });
      requestHeaders.set("cookie", updatedCookies.map(({ name, value }) => `${name}=${value}`).join("; "));
      const res = NextResponse.next({ request: { headers: requestHeaders } });
      res.cookies.set("access_token", newTokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: newTokens.expires_in ?? 3600,
      });
      res.cookies.set("refresh_token", newTokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }
  }

  // Refresh token juga expired / gagal refresh → redirect login
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/auth/v2/login", req.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  const res = NextResponse.redirect(loginUrl);
  // Hapus cookie lama yang sudah tidak valid
  res.cookies.delete("access_token");
  res.cookies.delete("refresh_token");
  res.cookies.delete("user_info");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
