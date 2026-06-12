// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";

export async function GET() {
  try {
    // Server bisa membaca cookie httpOnly
    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${GATEWAY_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      // Penting: jangan forward cookie browser secara otomatis ke external API
      credentials: "omit", 
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gateway error" }, 
        { status: res.status }
      );
    }

    const result = await res.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
