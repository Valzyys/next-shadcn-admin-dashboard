import type { NextRequest } from "next/server";

import { proxyApi } from "@/lib/api-proxy";

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyApi(req, "/api/pmj", (await params).path);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as HEAD };
