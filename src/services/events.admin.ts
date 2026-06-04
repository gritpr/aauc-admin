import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { serializeEventDoc } from "@/lib/firestore/serialize";
import type {
  ChapterEvent,
  ChapterEventInput,
  ChapterEventPatch,
  EventStatus,
} from "@/types/event";

const COLLECTION = "events";

function serializeEvent(
  id: string,
  data: FirebaseFirestore.DocumentData,
): ChapterEvent {
  return serializeEventDoc(id, data) as unknown as ChapterEvent;
}

export async function listAllEvents(): Promise<ChapterEvent[]> {
  const snapshot = await getAdminFirestore().collection(COLLECTION).get();

  const events = snapshot.docs.map((doc) =>
    serializeEvent(doc.id, doc.data()),
  );
  return events.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
}

export async function getEventById(id: string): Promise<ChapterEvent | null> {
  const doc = await getAdminFirestore().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  return serializeEvent(doc.id, doc.data()!);
}

export async function isSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const snapshot = await getAdminFirestore()
    .collection(COLLECTION)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return false;
  if (excludeId && snapshot.docs[0]!.id === excludeId) return false;
  return true;
}

export async function createEvent(
  input: ChapterEventInput,
): Promise<ChapterEvent> {
  const now = FieldValue.serverTimestamp();
  const ref = await getAdminFirestore()
    .collection(COLLECTION)
    .add({
      ...input,
      createdAt: now,
      updatedAt: now,
    });
  const created = await ref.get();
  return serializeEvent(created.id, created.data()!);
}

export async function updateEvent(
  id: string,
  patch: ChapterEventPatch,
): Promise<ChapterEvent> {
  if (Object.keys(patch).length === 0) {
    const existing = await getEventById(id);
    if (!existing) throw new Error("Event not found");
    return existing;
  }

  const ref = getAdminFirestore().collection(COLLECTION).doc(id);
  await ref.update({
    ...patch,
    updatedAt: FieldValue.serverTimestamp(),
  });
  const updated = await ref.get();
  return serializeEvent(updated.id, updated.data()!);
}

export async function deleteEvent(id: string): Promise<void> {
  await getAdminFirestore().collection(COLLECTION).doc(id).delete();
}

export async function setEventStatus(
  id: string,
  status: EventStatus,
): Promise<ChapterEvent> {
  return updateEvent(id, { status });
}
