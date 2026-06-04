import type { ChapterEventInput, ChapterEventPatch } from "@/types/event";

function parseDate(v: unknown): Date {
  if (!v) return new Date();
  return new Date(String(v));
}

/** Parse only keys present in the patch object (partial Firestore update). */
export function parseEventPatch(
  patch: Record<string, unknown>,
): ChapterEventPatch {
  const result: ChapterEventPatch = {};

  if ("title" in patch) result.title = String(patch.title ?? "");
  if ("slug" in patch)
    result.slug = String(patch.slug ?? "")
      .toLowerCase()
      .trim();
  if ("description" in patch) result.description = String(patch.description ?? "");
  if ("startDate" in patch) result.startDate = parseDate(patch.startDate);
  if ("endDate" in patch) result.endDate = parseDate(patch.endDate);
  if ("location" in patch) result.location = String(patch.location ?? "");
  if ("priceKobo" in patch) result.priceKobo = Number(patch.priceKobo ?? 0);
  if ("status" in patch)
    result.status = patch.status as ChapterEventInput["status"];
  if ("capacity" in patch)
    result.capacity = patch.capacity as number | null;
  if ("imageUrl" in patch)
    result.imageUrl = patch.imageUrl as string | null;
  if ("flierImageUrl" in patch)
    result.flierImageUrl = patch.flierImageUrl as string | null;
  if ("subtitle" in patch) result.subtitle = patch.subtitle as string | null;
  if ("theme" in patch) result.theme = patch.theme as string | null;
  if ("motto" in patch) result.motto = patch.motto as string | null;
  if ("accreditation" in patch)
    result.accreditation = patch.accreditation as string | null;
  if ("venue" in patch) result.venue = patch.venue as string | null;
  if ("pricingTiers" in patch)
    result.pricingTiers = patch.pricingTiers as ChapterEventInput["pricingTiers"];
  if ("tracks" in patch) result.tracks = patch.tracks as ChapterEventInput["tracks"];
  if ("abstractSubmission" in patch)
    result.abstractSubmission =
      patch.abstractSubmission as ChapterEventInput["abstractSubmission"];
  if ("contacts" in patch)
    result.contacts = patch.contacts as ChapterEventInput["contacts"];

  return result;
}

/** Parse full create payload. */
export function parseEventCreate(
  body: Record<string, unknown>,
): ChapterEventInput {
  const patch = parseEventPatch(body);
  return {
    title: patch.title ?? "",
    slug: patch.slug ?? "",
    description: patch.description ?? "",
    startDate: patch.startDate ?? new Date(),
    endDate: patch.endDate ?? new Date(),
    location: patch.location ?? "",
    priceKobo: patch.priceKobo ?? 0,
    status: patch.status ?? "draft",
    capacity: patch.capacity as number | null | undefined,
    imageUrl: patch.imageUrl as string | null | undefined,
    flierImageUrl: patch.flierImageUrl as string | null | undefined,
    subtitle: patch.subtitle as string | null | undefined,
    theme: patch.theme as string | null | undefined,
    motto: patch.motto as string | null | undefined,
    accreditation: patch.accreditation as string | null | undefined,
    venue: patch.venue as string | null | undefined,
    pricingTiers: patch.pricingTiers,
    tracks: patch.tracks,
    abstractSubmission: patch.abstractSubmission,
    contacts: patch.contacts,
  };
}
