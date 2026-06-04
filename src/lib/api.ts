import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionCookie } from "@/lib/auth/admin";

export async function requireAdminSession(): Promise<
  | { ok: true; email: string; uid: string }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await verifySessionCookie(session);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, email: user.email, uid: user.uid };
}
