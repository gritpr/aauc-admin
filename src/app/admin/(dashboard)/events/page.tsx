import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/dates";
import { formatNaira } from "@/lib/money";
import { isConferenceEvent } from "@/lib/registration/pricing";
import { listAllEvents } from "@/services/events.admin";

export default async function EventsPage() {
  const events = await listAllEvents();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-gray-500">
            Create, edit, and publish chapter events
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button>New event</Button>
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="font-medium text-gray-900 hover:text-[var(--primary)]"
                  >
                    {event.title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {event.slug}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDate(event.startDate)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatNaira(event.priceKobo)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {isConferenceEvent(event) ? "Conference" : "Simple"}
                </td>
                <td className="px-4 py-3">
                  <Badge status={event.status} />
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  No events yet.{" "}
                  <Link
                    href="/admin/events/new"
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    Create your first event
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
