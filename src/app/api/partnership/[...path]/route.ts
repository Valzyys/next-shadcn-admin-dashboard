import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Beda dari /api/gateway — router pt.js di-mount langsung di root,
// bukan di bawah /gateway. Auth tetap pakai access_token yang sama
// (verifyJWT + gateway_access_tokens), cuma base path-nya beda.
const PARTNERSHIP_BASE = "https://v5.jkt48connect.com/partnership";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const { path } = await params;
  const url = `${PARTNERSHIP_BASE}/${path.join("/")}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Origin": "https://next-shadcn-admin-dashboard-beta.vercel.app",
    "Referer": "https://next-shadcn-admin-dashboard-beta.vercel.app/",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { status: false, message: "Gateway error", raw: text.slice(0, 200) },
        { status: res.status }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { status: false, message: "Proxy error", error: String(e) },
      { status: 500 }
    );
  }
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
