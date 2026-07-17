"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { RegistrationStatus } from "@/types/registration";

export function RegistrationFilters({
  events,
}: {
  events: { id: string; title: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/admin/registrations?${next.toString()}`);
  }

  const inputClass =
    "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]";

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={params.get("eventId") ?? ""}
        onChange={(e) => update("eventId", e.target.value)}
        className={inputClass}
      >
        <option value="">All events</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.title}
          </option>
        ))}
      </select>
      <select
        value={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className={inputClass}
      >
        <option value="">All statuses</option>
        {(
          [
            "pending_payment",
            "payment_received",
            "cancelled",
          ] as RegistrationStatus[]
        ).map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <input
        type="search"
        placeholder="Search name, email, phone…"
        defaultValue={params.get("search") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            update("search", (e.target as HTMLInputElement).value);
          }
        }}
        className={`${inputClass} min-w-[200px]`}
      />
      <a
        href={`/api/admin/registrations?${params.toString()}&format=csv`}
        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Export CSV
      </a>
    </div>
  );
}
