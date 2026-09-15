import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { getEventById } from "@/services/events.admin";
import { listEventGallery } from "@/services/gallery.admin";
import { toDate } from "@/lib/dates";

const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Conference day matching today, or 1 when the event is not running. */
function resolveDefaultDay(startDate: string, endDate: string): number {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return 1;

  const offset = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(start).getTime()) / DAY_MS,
  );
  const span = Math.max(
    1,
    Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / DAY_MS) + 1,
  );

  return offset >= 0 && offset < span ? offset + 1 : 1;
}

export default async function EventGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const photos = await listEventGallery(id);

  return (
    <div>
      <Link
        href={`/admin/events/${id}`}
        className="text-sm text-gray-500 hover:text-[var(--primary)]"
      >
        ← Back to event
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Photo gallery</h1>
      <p className="mt-1 text-sm text-gray-500">
        {event.title} — photos appear on the public event page grouped by day.
      </p>

      <div className="mt-8">
        <GalleryManager
          eventId={id}
          startDate={event.startDate}
          endDate={event.endDate}
          initialPhotos={photos}
          initialDayTitles={event.galleryDayTitles ?? {}}
          defaultDay={resolveDefaultDay(event.startDate, event.endDate)}
        />
      </div>
    </div>
  );
}
