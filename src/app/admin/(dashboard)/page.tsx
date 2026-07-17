import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/dates";
import { formatNaira } from "@/lib/money";
import { listAllEvents } from "@/services/events.admin";
import { listRegistrations } from "@/services/registrations.admin";

export default async function AdminDashboardPage() {
  const [events, registrations] = await Promise.all([
    listAllEvents(),
    listRegistrations(),
  ]);

  const pending = registrations.filter(
    (r) => r.status === "pending_payment"
  ).length;
  const paid = registrations.filter(
    (r) => r.status === "payment_received" || r.status === "confirmed"
  );
  const confirmed = registrations.filter(
    (r) => r.status === "confirmed"
  ).length;
  const revenueKobo = paid.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const recentEvents = events.slice(0, 5);
  const recentRegistrations = registrations.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-gray-500">
        Manage chapter events and registrations
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total registrations" value={registrations.length} />
        <StatCard label="Confirmed" value={confirmed} />
        <StatCard label="Pending payments" value={pending} highlight />
        <StatCard label="Revenue collected" value={formatNaira(revenueKobo)} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent events
            </h2>
            <Link
              href="/admin/events"
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="font-medium text-gray-900 hover:text-[var(--primary)]"
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(event.startDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={event.status} />
                    </td>
                  </tr>
                ))}
                {recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No events yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent registrations
            </h2>
            <Link
              href="/admin/registrations"
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{reg.fullName}</p>
                      <p className="text-xs text-gray-500">{reg.eventTitle}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatNaira(reg.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={reg.status} />
                    </td>
                  </tr>
                ))}
                {recentRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No registrations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 ${
        highlight ? "border-[var(--primary)]" : "border-gray-200"
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`mt-1 text-3xl font-bold ${
          highlight ? "text-[var(--primary)]" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
