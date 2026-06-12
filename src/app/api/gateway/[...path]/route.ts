import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const { path } = await params;
  const url = `${GATEWAY_BASE}/${path.join("/")}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const init: RequestInit = { method: req.method, headers };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const res = await fetch(url, init);
  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
