import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { fetchUpstream } from "@/lib/upstream";

export async function proxyApi(req: NextRequest, prefix: string, path: string[]) {
  const token = (await cookies()).get("access_token")?.value;
  const headers = new Headers({ Accept: "application/json" });
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (prefix === "/partnership" && process.env.PARTNERSHIP_PROXY_SECRET) {
    headers.set("x-proxy-secret", process.env.PARTNERSHIP_PROXY_SECRET);
  }
  try {
    const upstream = await fetchUpstream(`${prefix}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
      redirect: "manual",
    });
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const key of ["content-type", "content-disposition", "retry-after"]) {
      const value = upstream.headers.get(key);
      if (value) responseHeaders.set(key, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ status: false, message: "API sementara tidak tersedia" }, { status: 502 });
  }
}
