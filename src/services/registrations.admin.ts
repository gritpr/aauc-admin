import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { deleteRegistrationStorageFiles } from "@/lib/registration/storage";
import { serializeRegistrationDoc } from "@/lib/firestore/serialize";
import type {
  Registration,
  RegistrationStatus,
} from "@/types/registration";

const COLLECTION = "registrations";

function serializeRegistration(
  id: string,
  data: FirebaseFirestore.DocumentData,
): Registration {
  return serializeRegistrationDoc(id, data) as unknown as Registration;
}

export interface RegistrationFilters {
  eventId?: string;
  status?: RegistrationStatus;
  search?: string;
}

export async function listRegistrations(
  filters: RegistrationFilters = {}
): Promise<Registration[]> {
  let query: FirebaseFirestore.Query = getAdminFirestore().collection(
    COLLECTION
  );

  if (filters.eventId) {
    query = query.where("eventId", "==", filters.eventId);
  }
  if (filters.status) {
    query = query.where("status", "==", filters.status);
  }

  const snapshot = await query.get();
  let registrations = snapshot.docs.map((doc) =>
    serializeRegistration(doc.id, doc.data())
  );

  if (filters.search) {
    const term = filters.search.toLowerCase();
    registrations = registrations.filter(
      (r) =>
        r.fullName.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.phone.includes(term)
    );
  }

  return registrations.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getRegistrationById(
  id: string
): Promise<Registration | null> {
  const doc = await getAdminFirestore()
    .collection(COLLECTION)
    .doc(id)
    .get();
  if (!doc.exists) return null;
  return serializeRegistration(doc.id, doc.data()!);
}

export async function updateRegistrationStatus(
  id: string,
  status: RegistrationStatus
): Promise<Registration> {
  const ref = getAdminFirestore().collection(COLLECTION).doc(id);
  const updates: Record<string, unknown> = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (status === "payment_received") {
    updates.paidAt = FieldValue.serverTimestamp();
  }

  await ref.update(updates);
  const updated = await ref.get();
  return serializeRegistration(updated.id, updated.data()!);
}

export async function deleteRegistration(id: string): Promise<void> {
  const registration = await getRegistrationById(id);
  if (!registration) {
    throw new Error("Registration not found");
  }

  await deleteRegistrationStorageFiles(id, [
    registration.photoUrl,
    registration.idDocUrl,
  ]);

  await getAdminFirestore().collection(COLLECTION).doc(id).delete();
}

export async function deleteRegistrations(ids: string[]): Promise<{
  deleted: number;
  notFound: string[];
  failed: { id: string; error: string }[];
}> {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  const notFound: string[] = [];
  const failed: { id: string; error: string }[] = [];
  let deleted = 0;

  for (const id of uniqueIds) {
    try {
      await deleteRegistration(id);
      deleted += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      if (message.includes("not found")) {
        notFound.push(id);
      } else {
        failed.push({ id, error: message });
      }
    }
  }

  return { deleted, notFound, failed };
}

export function registrationsToCsv(registrations: Registration[]): string {
  const headers = [
    "id",
    "eventId",
    "eventTitle",
    "fullName",
    "email",
    "phone",
    "status",
    "amount",
    "currency",
    "organization",
    "role",
    "cadre",
    "preferredNameOnCertificate",
    "participantStatus",
    "gender",
    "industry",
    "institution",
    "paystackReference",
    "photoUrl",
    "idDocUrl",
    "createdAt",
    "updatedAt",
    "paidAt",
  ];

  const escape = (value: unknown) => {
    const str = value == null ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = registrations.map((r) =>
    headers.map((h) => escape(r[h as keyof Registration])).join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}
