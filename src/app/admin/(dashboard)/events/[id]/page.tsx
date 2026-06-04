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
            <span className="font-mono text-sm text-gray-500">/{event.slug}</span>
          </div>
        </div>
        {event.id && <EventActions id={event.id} status={event.status} />}
      </div>

      <div className="mt-8">
        <EventForm event={event} />
      </div>
    </div>
  );
}
