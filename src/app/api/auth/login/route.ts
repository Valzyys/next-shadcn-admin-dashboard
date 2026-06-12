// src/app/api/auth/login/route.ts
// Gateway dipanggil dari client, route handler ini hanya bertugas set cookie httpOnly

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { access_token, refresh_token, expires_in, user, remember } = await req.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { status: false, message: "Token tidak valid" },
        { status: 400 }
      );
    }

    const rememberDays = remember ? 30 : null;
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/dashboard";

    const res = NextResponse.json({
      status: true,
      message: "Login berhasil",
      data: { user, redirectUrl: callbackUrl },
    });

    res.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: rememberDays ? rememberDays * 24 * 60 * 60 : (expires_in ?? 3600),
    });

     res.cookies.set("gateway_token", access_token, {
      httpOnly: false,
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

    // Info user untuk client-side display (non-httpOnly)
    if (user) {
      res.cookies.set("user_info", JSON.stringify(user), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: rememberDays ? rememberDays * 24 * 60 * 60 : (expires_in ?? 3600),
      });
    }

    return res;
  } catch (err) {
    console.error("[api/auth/login]", err);
    return NextResponse.json(
      { status: false, message: "Internal server error", error: String(err) },
      { status: 500 }
    );
  }
}
