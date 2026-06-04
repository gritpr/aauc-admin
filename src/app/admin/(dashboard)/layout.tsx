import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { SESSION_COOKIE, verifySessionCookie } from "@/lib/auth/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await verifySessionCookie(session);

  if (!user) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
