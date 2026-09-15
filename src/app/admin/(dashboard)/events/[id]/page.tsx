import Link from "next/link";
import { notFound } from "next/navigation";
import { EventActions } from "@/components/admin/EventActions";
import { EventForm } from "@/components/admin/EventForm";
import { Badge } from "@/components/ui/Badge";
import { getEventById } from "@/services/events.admin";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/events"
            className="text-sm text-gray-500 hover:text-[var(--primary)]"
          >
            ← Back to events
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{event.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge status={event.status} />
            {event.registrationClosed && <Badge status="registration_closed" />}
            <span className="font-mono text-sm text-gray-500">/{event.slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/events/${event.id}/gallery`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Photo gallery
          </Link>
          {event.id && (
            <EventActions
              id={event.id}
              status={event.status}
              registrationClosed={event.registrationClosed ?? false}
            />
          )}
        </div>
      </div>

      <div className="mt-8">
        <EventForm event={event} />
      </div>
    </div>
  );
}
