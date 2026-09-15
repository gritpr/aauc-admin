import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin";
import { toIsoString } from "@/lib/firestore/serialize";
import type {
  GalleryPhoto,
  GalleryPhotoInput,
  GalleryPhotoPatch,
} from "@/types/gallery";

function galleryRef(eventId: string) {
  return getAdminFirestore()
    .collection("events")
    .doc(eventId)
    .collection("gallery");
}

function serializePhoto(
  id: string,
  data: FirebaseFirestore.DocumentData,
): GalleryPhoto {
  return {
    id,
    day: typeof data.day === "number" ? data.day : 1,
    caption: data.caption ?? "",
    imageUrl: data.imageUrl ?? "",
    storagePath: data.storagePath ?? "",
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    createdAt: toIsoString(data.createdAt) ?? "",
    updatedAt: toIsoString(data.updatedAt) ?? "",
  };
}

/** Sorted by day, then by position within the day. */
export async function listEventGallery(
  eventId: string,
): Promise<GalleryPhoto[]> {
  const snapshot = await galleryRef(eventId).get();

  return snapshot.docs
    .map((doc) => serializePhoto(doc.id, doc.data()))
    .sort(
      (a, b) =>
        a.day - b.day ||
        a.sortOrder - b.sortOrder ||
        a.createdAt.localeCompare(b.createdAt),
    );
}

/** One past the highest position currently used on that day. */
export async function nextSortOrder(
  eventId: string,
  day: number,
): Promise<number> {
  const snapshot = await galleryRef(eventId).where("day", "==", day).get();
  if (snapshot.empty) return 0;

  const highest = Math.max(
    ...snapshot.docs.map((doc) => {
      const value = doc.data().sortOrder;
      return typeof value === "number" ? value : 0;
    }),
  );
  return highest + 1;
}

export async function addGalleryPhoto(
  eventId: string,
  input: GalleryPhotoInput,
): Promise<GalleryPhoto> {
  const now = FieldValue.serverTimestamp();
  const ref = await galleryRef(eventId).add({
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  const created = await ref.get();
  return serializePhoto(created.id, created.data()!);
}

export async function updateGalleryPhoto(
  eventId: string,
  photoId: string,
  patch: GalleryPhotoPatch,
): Promise<GalleryPhoto> {
  const ref = galleryRef(eventId).doc(photoId);
  const existing = await ref.get();
  if (!existing.exists) throw new Error("Photo not found");

  if (Object.keys(patch).length > 0) {
    await ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
  }

  const updated = await ref.get();
  return serializePhoto(updated.id, updated.data()!);
}

/**
 * Removes the document and its Storage object. A missing or already-deleted
 * file is not fatal — the document is what the site reads, so it still goes.
 */
export async function deleteGalleryPhoto(
  eventId: string,
  photoId: string,
): Promise<void> {
  const ref = galleryRef(eventId).doc(photoId);
  const existing = await ref.get();
  if (!existing.exists) throw new Error("Photo not found");

  const storagePath = existing.data()?.storagePath as string | undefined;

  if (storagePath) {
    try {
      await getAdminStorage().bucket().file(storagePath).delete();
    } catch (err) {
      console.error("Gallery file delete failed:", storagePath, err);
    }
  }

  await ref.delete();
}
