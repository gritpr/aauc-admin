import { getAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string): boolean {
  const allowed = getAdminEmails();
  if (allowed.length === 0) return true;
  return allowed.includes(email.toLowerCase());
}

export async function verifySessionCookie(
  sessionCookie: string | undefined
): Promise<{ uid: string; email: string } | null> {
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true
    );
    const email = decoded.email;
    if (!email || !isEmailAllowed(email)) return null;
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}

export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  return getAdminAuth().createSessionCookie(idToken, { expiresIn });
}

export async function revokeSessionCookie(sessionCookie: string): Promise<void> {
  const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
  await getAdminAuth().revokeRefreshTokens(decoded.sub);
}
