// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, remember } = body;

    if (!email || !password) {
      return NextResponse.json(
        { status: false, message: "email dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Step 1: coba fetch ke gateway
    let gwRes: Response;
    try {
      gwRes = await fetch(`${GATEWAY_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });
    } catch (fetchErr) {
      // Fetch sendiri gagal (DNS, timeout, network)
      return NextResponse.json(
        { status: false, message: "Fetch gagal", error: String(fetchErr) },
        { status: 502 }
      );
    }

    // Step 2: baca response sebagai text dulu, baru parse
    const rawText = await gwRes.text();
    let result: any;
    try {
      result = JSON.parse(rawText);
    } catch {
      // Gateway return HTML atau non-JSON
      return NextResponse.json(
        {
          status: false,
          message: `Gateway HTTP ${gwRes.status} — bukan JSON`,
          raw: rawText.slice(0, 300),
        },
        { status: 502 }
      );
    }

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.message },
        { status: gwRes.status }
      );
    }

    // Step 3: validasi struktur data
    const { access_token, refresh_token, expires_in } = result.data ?? {};
    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { status: false, message: "Token tidak ada di response gateway", result },
        { status: 502 }
      );
    }

    const rememberDays = remember ? 30 : null;
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/dashboard";

    const res = NextResponse.redirect(new URL(callbackUrl, req.url), { status: 302 });

    res.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: rememberDays ? rememberDays * 24 * 60 * 60 : expires_in,
    });

    res.cookies.set("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(rememberDays ? { maxAge: rememberDays * 24 * 60 * 60 } : {}),
    });

    res.cookies.set("user_info", JSON.stringify(result.data.user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: rememberDays ? rememberDays * 24 * 60 * 60 : expires_in,
    });

    return res;
  } catch (err) {
    // Catch-all — tangkap error yang tidak terduga
    return NextResponse.json(
      { status: false, message: "Unhandled error", error: String(err) },
      { status: 500 }
    );
  }
}
