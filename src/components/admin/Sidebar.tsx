"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSnackbar } from "@/components/ui/Snackbar";
import { siteConfig } from "@/config/site";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/registrations", label: "Registrations" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
          {siteConfig.chapterName}
        </p>
        <h1 className="mt-1 text-lg font-bold text-gray-900">
          {siteConfig.adminTitle}
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[var(--primary)] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <LogoutButton />
      </div>
    </aside>
  );
}

function LogoutButton() {
  const { showSuccess, showError } = useSnackbar();

  async function handleLogout() {
    const res = await fetch("/api/auth/session", { method: "DELETE" });
    if (!res.ok) {
      showError("Sign out failed");
      return;
    }
    showSuccess("Signed out");
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
    >
      Sign out
    </button>
  );
}
