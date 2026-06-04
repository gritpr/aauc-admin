import { Timestamp } from "firebase-admin/firestore";

/** Remove undefined fields — Firestore rejects undefined on write. */
export function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/** Convert Firestore Timestamp, Date, or ISO string to a serializable ISO string. */
export function toIsoString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "object" && "_seconds" in value) {
    const { _seconds, _nanoseconds = 0 } = value as {
      _seconds: number;
      _nanoseconds?: number;
    };
    return new Date(_seconds * 1000 + _nanoseconds / 1e6).toISOString();
  }
  return undefined;
}

const EVENT_DATE_FIELDS = [
  "startDate",
  "endDate",
  "createdAt",
  "updatedAt",
] as const;

export function serializeEventDoc(
  id: string,
  data: FirebaseFirestore.DocumentData
): Record<string, unknown> {
  const out: Record<string, unknown> = { id, ...data };
  for (const field of EVENT_DATE_FIELDS) {
    if (field in data) {
      out[field] = toIsoString(data[field]) ?? "";
    }
  }
  return out;
}

const REGISTRATION_DATE_FIELDS = [
  "createdAt",
  "updatedAt",
  "paidAt",
  "emailSentAt",
] as const;

export function serializeRegistrationDoc(
  id: string,
  data: FirebaseFirestore.DocumentData
): Record<string, unknown> {
  const out: Record<string, unknown> = { id, ...data };
  for (const field of REGISTRATION_DATE_FIELDS) {
    if (field in data && data[field] != null) {
      out[field] = toIsoString(data[field]);
    }
  }
  return out;
}
