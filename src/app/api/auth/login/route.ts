// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";

export async function POST(req: NextRequest) {
  try {
    const { email, password, remember } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: false, message: "email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const gwRes = await fetch(`${GATEWAY_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
      }),
    });

    const result = await gwRes.json();

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.message },
        { status: gwRes.status }
      );
    }

    const { access_token, refresh_token, expires_in } = result.data;
    const rememberDays = remember ? 30 : null;

    // Ambil callbackUrl dari query string kalau ada
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/dashboard";

    // Redirect dari server — cookie pasti sudah di-set sebelum browser navigate
    const res = NextResponse.redirect(new URL(callbackUrl, req.url), {
      status: 302,
    });

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

    // Simpan info user di cookie non-httpOnly untuk kebutuhan client-side (opsional)
    res.cookies.set("user_info", JSON.stringify(result.data.user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: rememberDays ? rememberDays * 24 * 60 * 60 : expires_in,
    });

    return res;
  } catch (err) {
    console.error("[api/auth/login]", err);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
