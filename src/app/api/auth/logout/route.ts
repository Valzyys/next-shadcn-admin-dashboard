import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ status: true, message: "Logout berhasil" });

  res.cookies.delete("access_token");
  res.cookies.delete("gateway_token");
  res.cookies.delete("refresh_token");
  res.cookies.delete("user_info");

  return res;
}
