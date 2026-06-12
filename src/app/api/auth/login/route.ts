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

    const res = NextResponse.json({
      status: true,
      message: result.message,
      data: { user: result.data.user },
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

    return res;
  } catch (err) {
    console.error("[api/auth/login]", err);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
