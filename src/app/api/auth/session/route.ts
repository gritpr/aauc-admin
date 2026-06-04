import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  SESSION_COOKIE,
  createSessionCookie,
  isEmailAllowed,
  revokeSessionCookie,
} from "@/lib/auth/admin";

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) {
      return NextResponse.json({ error: "No email on account" }, { status: 403 });
    }
    if (!isEmailAllowed(email)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const sessionCookie = await createSessionCookie(idToken);
    const response = NextResponse.json({ email });
    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 5,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  const cookie = (await import("next/headers")).cookies;
  const store = await cookie();
  const session = store.get(SESSION_COOKIE)?.value;
  if (session) {
    try {
      await revokeSessionCookie(session);
    } catch {
      /* ignore */
    }
  }
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
