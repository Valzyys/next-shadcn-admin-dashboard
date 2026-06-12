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

    let gwRes: Response;
    let result: any;

    try {
      gwRes = await fetch(`${GATEWAY_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });
      result = await gwRes.json();
    } catch (fetchErr) {
      console.error("[api/auth/login] fetch to gateway failed:", fetchErr);
      return NextResponse.json(
        { status: false, message: "Gagal menghubungi server autentikasi", error: String(fetchErr) },
        { status: 502 }
      );
    }

    console.log("[api/auth/login] gateway response:", gwRes.status, JSON.stringify(result));

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.message },
        { status: gwRes.status }
      );
    }

    const { access_token, refresh_token, expires_in } = result.data ?? {};

    if (!access_token || !refresh_token) {
      console.error("[api/auth/login] token missing in gateway response", result);
      return NextResponse.json(
        { status: false, message: "Respon gateway tidak valid" },
        { status: 502 }
      );
    }

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
      maxAge: rememberDays ? rememberDays * 24 * 60 * 60 : (expires_in ?? 3600),
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
    console.error("[api/auth/login] unhandled error:", err);
    return NextResponse.json(
      { status: false, message: "Internal server error", error: String(err) },
      { status: 500 }
    );
  }
}
