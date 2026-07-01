import { type NextRequest, NextResponse } from "next/server";

// Whitelist domain sumber gambar/media yang boleh di-proxy — mencegah proxy disalahgunakan sebagai open relay.
const ALLOWED_HOSTS = ["imgpm.jkt48connect.com", "images.jkt48connect.com"];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const upstream = await fetch(parsed.toString());

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to fetch upstream" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
