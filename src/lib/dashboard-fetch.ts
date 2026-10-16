"use client";

import { toast } from "sonner";

// Keep existing response contracts, while making failed reads and mutations visible.
export async function fetchDashboardApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(input, init);
    const body = await response
      .clone()
      .json()
      .catch(() => null);
    const expectedMissingMerchant = response.status === 404 && /\/api\/gateway(?:\/v2)?\/merchant$/.test(String(input));
    if ((!response.ok || body?.status === false) && !expectedMissingMerchant) {
      toast.error(body?.message || `Permintaan gagal (${response.status})`);
    }
    if (body === null) return Response.json({ status: false, message: "Respons API tidak valid" }, { status: 502 });
    return response;
  } catch {
    const message = "Tidak dapat menghubungi API. Coba lagi.";
    toast.error(message);
    return Response.json({ status: false, message }, { status: 502 });
  }
}
