import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  const expected = process.env.TEST_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "TEST_PASSWORD not set" }, { status: 500 });
  }

  if (password !== expected) {
    return NextResponse.json({ ok: false, error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // Cookie valid for 7 days
  res.cookies.set("cd_test", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}


