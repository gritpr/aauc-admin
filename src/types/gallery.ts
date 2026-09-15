/**
 * Event photo gallery — shared shape with the public site (`aauc-sigma`).
 *
 * Firestore: `events/{eventId}/gallery/{photoId}`
 * Storage:   `events/{slug}/gallery/{uuid}.{ext}`
 *
 * Photos store a day *number* only; the public site derives each day's calendar
 * date from the event's startDate. Per-day headlines live on the event document
 * as `galleryDayTitles`.
 */

/** Serialized photo (ISO date strings — safe for RSC / client props). */
export interface GalleryPhoto {
  id: string;
  day: number;
  caption: string;
  imageUrl: string;
  storagePath: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryPhotoInput {
  day: number;
  caption: string;
  imageUrl: string;
  storagePath: string;
  sortOrder: number;
}

export type GalleryPhotoPatch = Partial<
  Pick<GalleryPhoto, "day" | "caption" | "sortOrder">
>;
