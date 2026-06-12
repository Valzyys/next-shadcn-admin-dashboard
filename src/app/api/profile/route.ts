// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { status: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Kunci utama: Teruskan header browser asli ke gateway
    // sehingga gateway TIDAK mendeteksi ini sebagai bot/server request
    const forwardedHeaders = new Headers();
    
    // Header yang WAJIB diteruskan agar tidak terdeteksi bot
    const headersToForward = [
      "user-agent",
      "accept",
      "accept-language",
      "accept-encoding",
      "origin",
      "referer",
      "sec-ch-ua",
      "sec-ch-ua-mobile",
      "sec-ch-ua-platform",
      "sec-fetch-dest",
      "sec-fetch-mode",
      "sec-fetch-site",
    ];

    for (const key of headersToForward) {
      const value = req.headers.get(key);
      if (value) forwardedHeaders.set(key, value);
    }

    // Set Authorization dari cookie httpOnly (bukan dari header client)
    forwardedHeaders.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${GATEWAY_BASE}/profile`, {
      method: "GET",
      headers: forwardedHeaders,
      // Jangan set credentials karena kita manage auth manual via cookie
    });

    const body = await res.text();

    if (!res.ok) {
      console.error("[api/profile] Gateway rejected:", res.status, body);
      return NextResponse.json(
        { status: false, message: "Gateway error", details: body },
        { status: res.status }
      );
    }

    return new NextResponse(body, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[api/profile]", err);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
