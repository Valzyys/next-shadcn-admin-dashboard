// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";

// Fingerprint Chrome terbaru yang konsisten
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-CH-UA": '"Chromium";v="131", "Not_A Brand";v="24"',
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "cross-site",
};

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { status: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Gabungkan header browser palsu + Authorization dari cookie httpOnly
    const headers = new Headers(BROWSER_HEADERS);
    headers.set("Authorization", `Bearer ${token}`);

    // Gunakan origin/referer dari request client agar lebih meyakinkan
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    if (origin) headers.set("Origin", origin);
    if (referer) headers.set("Referer", referer);

    const res = await fetch(`${GATEWAY_BASE}/profile`, {
      method: "GET",
      headers,
      // credentials: "omit" sudah benar karena auth via Bearer token
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[api/profile] Gateway blocked:", res.status, body);
      return NextResponse.json(
        { status: false, message: "Gateway error", details: body },
        { status: res.status }
      );
    }

    const result = await res.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/profile] Internal Error:", error);
    return NextResponse.json(
      { status: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
