import { Suspense } from "react";
import { RegistrationFilters } from "@/components/admin/RegistrationFilters";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
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

      <RegistrationTable registrations={registrations} />
    </div>
  );
}
