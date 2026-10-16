import type { NextRequest } from "next/server";

import { proxyApi } from "@/lib/api-proxy";

export function GET(req: NextRequest) {
  return proxyApi(req, "/gateway", ["profile"]);
}
