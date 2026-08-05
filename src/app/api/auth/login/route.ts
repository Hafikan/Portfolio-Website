/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { createSessionToken, secretsMatch, SESSION_TTL_SECONDS } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    const adminPassword = process.env.ADMIN_PASSWORD;
    // No password configured means no way to authenticate. Never treat that as
    // a successful login (an empty submitted password would otherwise match).
    if (!adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (typeof password === "string" && (await secretsMatch(password, adminPassword))) {
      const token = await createSessionToken();
      const response = NextResponse.json({ success: true });
      response.cookies.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: SESSION_TTL_SECONDS, // matches the token's own `exp` claim
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
