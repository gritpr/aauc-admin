import Link from "next/link";
import { Suspense } from "react";
import { RegistrationFilters } from "@/components/admin/RegistrationFilters";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/dates";
import { formatNaira } from "@/lib/money";
import { listAllEvents } from "@/services/events.admin";
import { listRegistrations } from "@/services/registrations.admin";
import type { RegistrationStatus } from "@/types/registration";

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    eventId?: string;
    status?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const [events, registrations] = await Promise.all([
    listAllEvents(),
    listRegistrations({
      eventId: params.eventId,
      status: params.status as RegistrationStatus | undefined,
      search: params.search,
    }),
  ]);

  const eventOptions = events
    .filter((e) => e.id)
    .map((e) => ({ id: e.id!, title: e.title }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
      <p className="mt-1 text-gray-500">
        Review payments, confirm attendees, export CSV
      </p>

      <div className="mt-6">
        <Suspense fallback={<div className="h-10" />}>
          <RegistrationFilters events={eventOptions} />
        </Suspense>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Registrant</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {registrations.map((reg) => (
              <tr key={reg.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/registrations/${reg.id}`}
                    className="font-medium text-gray-900 hover:text-[var(--primary)]"
                  >
                    {reg.fullName}
                  </Link>
                  <p className="text-xs text-gray-500">{reg.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{reg.eventTitle}</td>
                <td className="px-4 py-3 text-gray-600">
                  {formatNaira(reg.amount)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDateTime(reg.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Badge status={reg.status} />
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  No registrations match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
