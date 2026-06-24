import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Router partnership di upstream. Sesuaikan jika di-mount di root.
const PARTNERSHIP_BASE = "https://v5.jkt48connect.com/partnership";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const { path } = await params;
  const url = `${PARTNERSHIP_BASE}/${path.join("/")}${req.nextUrl.search}`;

  // Header diramping agar mirip curl yang berhasil.
  // JANGAN kirim Origin/Referer palsu — itu memicu bot-detection Cloudflare.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "curl/8.7.1", // tiru curl yang lolos
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
      // Deteksi challenge Cloudflare agar pesan error lebih jelas
      const isCloudflare =
        text.includes("Just a moment") ||
        (res.headers.get("server") ?? "").includes("cloudflare");

      return NextResponse.json(
        {
          status: false,
          message: isCloudflare
            ? "Upstream diblokir Cloudflare (bot protection / WAF)"
            : "Gateway error",
          upstreamStatus: res.status,
          raw: text.slice(0, 200),
        },
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
