import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { RegistrationActions } from "@/components/admin/RegistrationActions";
import { RegistrationDetailActions } from "@/components/admin/RegistrationDetailActions";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/dates";
import { formatNaira } from "@/lib/money";
import { getRegistrationById } from "@/services/registrations.admin";

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const registration = await getRegistrationById(id);
  if (!registration) notFound();

  const fields: { label: string; value: string | null | undefined }[] = [
    { label: "Email", value: registration.email },
    { label: "Phone", value: registration.phone },
    { label: "Event", value: registration.eventTitle },
    { label: "Amount", value: formatNaira(registration.amount) },
    { label: "Organization", value: registration.organization },
    { label: "Role", value: registration.role },
    { label: "Cadre", value: registration.cadre },
    {
      label: "Certificate name",
      value: registration.preferredNameOnCertificate,
    },
    { label: "Participant status", value: registration.participantStatus },
    { label: "Gender", value: registration.gender },
    { label: "Industry", value: registration.industry },
    { label: "Institution", value: registration.institution },
    { label: "Paystack reference", value: registration.paystackReference },
    { label: "Registered", value: formatDateTime(registration.createdAt) },
    { label: "Updated", value: formatDateTime(registration.updatedAt) },
  ];

  return (
    <div>
      <Link
        href="/admin/registrations"
        className="text-sm text-gray-500 hover:text-[var(--primary)]"
      >
        ← Back to registrations
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {registration.fullName}
          </h1>
          <div className="mt-2">
            <Badge status={registration.status} />
          </div>
        </div>
        {registration.id && (
          <RegistrationActions
            id={registration.id}
            currentStatus={registration.status}
          />
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
          <dl className="space-y-3">
            {fields.map(
              (f) =>
                f.value && (
                  <div key={f.label} className="grid grid-cols-3 gap-2 text-sm">
                    <dt className="font-medium text-gray-500">{f.label}</dt>
                    <dd className="col-span-2 text-gray-900">{f.value}</dd>
                  </div>
                )
            )}
          </dl>
        </div>

        {registration.photoUrl && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Tag photo
            </h2>
            <Image
              src={registration.photoUrl}
              alt="Tag photo"
              width={400}
              height={400}
              className="rounded-lg object-cover"
              unoptimized
            />
          </div>
        )}

        {registration.idDocUrl && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              ID document
            </h2>
            <Image
              src={registration.idDocUrl}
              alt="ID document"
              width={400}
              height={400}
              className="rounded-lg object-cover"
              unoptimized
            />
          </div>
        )}
      </div>

      {registration.id && (
        <RegistrationDetailActions
          id={registration.id}
          fullName={registration.fullName}
          photoUrl={registration.photoUrl}
          idDocUrl={registration.idDocUrl}
        />
      )}
    </div>
  );
}
