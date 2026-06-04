import { nairaToKobo } from "@/lib/money";
import { toInputDateTime } from "@/lib/dates";
import type {
  AbstractSubmission,
  ChapterEvent,
  PricingTier,
} from "@/types/event";

export type EventFormData = {
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  priceNaira: number;
  status: "draft" | "published";
  capacity: string;
  imageUrl: string;
  flierImageUrl: string;
  subtitle: string;
  theme: string;
  motto: string;
  accreditation: string;
  pricingTiers: PricingTier[];
  abstractKeywordsCount: string;
  abstractWordLimit: string;
  abstractStructure: string;
  abstractFormats: string;
  abstractGuidelines: string;
};

export function parseFormatsInput(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formatsToInput(formats?: string[]): string {
  return formats?.join("\n") ?? "";
}

export function buildAbstractSubmissionFromForm(
  form: EventFormData,
): AbstractSubmission | null {
  const formats = parseFormatsInput(form.abstractFormats);
  const keywordsCount = form.abstractKeywordsCount
    ? Number(form.abstractKeywordsCount)
    : undefined;
  const wordLimit = form.abstractWordLimit
    ? Number(form.abstractWordLimit)
    : undefined;
  const structure = form.abstractStructure.trim() || undefined;
  const guidelines = form.abstractGuidelines.trim() || undefined;

  const hasAny =
    keywordsCount ||
    wordLimit ||
    structure ||
    formats.length > 0 ||
    guidelines;

  if (!hasAny) return null;

  return {
    ...(keywordsCount != null ? { keywordsCount } : {}),
    ...(wordLimit != null ? { wordLimit } : {}),
    ...(structure ? { structure } : {}),
    ...(formats.length > 0 ? { formats } : {}),
    ...(guidelines ? { guidelines } : {}),
  };
}

export function eventToForm(event?: ChapterEvent): EventFormData {
  const abstract = event?.abstractSubmission;
  return {
    title: event?.title ?? "",
    slug: event?.slug ?? "",
    description: event?.description ?? "",
    startDate: event ? toInputDateTime(event.startDate) : "",
    endDate: event ? toInputDateTime(event.endDate) : "",
    location: event?.location ?? "",
    venue: event?.venue ?? "",
    priceNaira: event ? event.priceKobo / 100 : 0,
    status: event?.status ?? "draft",
    capacity: event?.capacity != null ? String(event.capacity) : "",
    imageUrl: event?.imageUrl ?? "",
    flierImageUrl: event?.flierImageUrl ?? "",
    subtitle: event?.subtitle ?? "",
    theme: event?.theme ?? "",
    motto: event?.motto ?? "",
    accreditation: event?.accreditation ?? "",
    pricingTiers: event?.pricingTiers ?? [],
    abstractKeywordsCount:
      abstract?.keywordsCount != null ? String(abstract.keywordsCount) : "",
    abstractWordLimit:
      abstract?.wordLimit != null ? String(abstract.wordLimit) : "",
    abstractStructure: abstract?.structure ?? "",
    abstractFormats: formatsToInput(abstract?.formats),
    abstractGuidelines: abstract?.guidelines ?? "",
  };
}

function optionalString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function tiersEqual(a: PricingTier[], b: PricingTier[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function abstractEqual(
  a: AbstractSubmission | null,
  b: AbstractSubmission | null,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Build a patch containing only fields that changed (for Firestore partial update). */
export function buildEventUpdatePatch(
  initial: EventFormData,
  current: EventFormData,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (current.title !== initial.title) patch.title = current.title;
  if (current.slug !== initial.slug) patch.slug = current.slug;
  if (current.description !== initial.description)
    patch.description = current.description;
  if (current.startDate !== initial.startDate)
    patch.startDate = current.startDate;
  if (current.endDate !== initial.endDate) patch.endDate = current.endDate;
  if (current.location !== initial.location) patch.location = current.location;
  if (current.status !== initial.status) patch.status = current.status;
  if (current.priceNaira !== initial.priceNaira)
    patch.priceKobo = nairaToKobo(current.priceNaira);

  if (current.venue !== initial.venue) {
    patch.venue = optionalString(current.venue);
  }
  if (current.capacity !== initial.capacity) {
    patch.capacity = current.capacity ? Number(current.capacity) : null;
  }
  if (current.imageUrl !== initial.imageUrl) {
    patch.imageUrl = optionalString(current.imageUrl);
  }
  if (current.flierImageUrl !== initial.flierImageUrl) {
    patch.flierImageUrl = optionalString(current.flierImageUrl);
  }
  if (current.subtitle !== initial.subtitle) {
    patch.subtitle = optionalString(current.subtitle);
  }
  if (current.theme !== initial.theme) {
    patch.theme = optionalString(current.theme);
  }
  if (current.motto !== initial.motto) {
    patch.motto = optionalString(current.motto);
  }
  if (current.accreditation !== initial.accreditation) {
    patch.accreditation = optionalString(current.accreditation);
  }
  if (!tiersEqual(current.pricingTiers, initial.pricingTiers)) {
    patch.pricingTiers =
      current.pricingTiers.length > 0 ? current.pricingTiers : null;
  }

  const initialAbstract = buildAbstractSubmissionFromForm(initial);
  const currentAbstract = buildAbstractSubmissionFromForm(current);
  if (!abstractEqual(initialAbstract, currentAbstract)) {
    patch.abstractSubmission = currentAbstract;
  }

  return patch;
}

/** Full payload for new events (matches public app shape with null for empty optionals). */
export function formToCreatePayload(
  form: EventFormData,
): Record<string, unknown> {
  return {
    title: form.title,
    slug: form.slug,
    description: form.description,
    startDate: form.startDate,
    endDate: form.endDate,
    location: form.location,
    venue: optionalString(form.venue),
    priceKobo: nairaToKobo(form.priceNaira),
    status: form.status,
    capacity: form.capacity ? Number(form.capacity) : null,
    imageUrl: optionalString(form.imageUrl),
    flierImageUrl: optionalString(form.flierImageUrl),
    subtitle: optionalString(form.subtitle),
    theme: optionalString(form.theme),
    motto: optionalString(form.motto),
    accreditation: optionalString(form.accreditation),
    pricingTiers: form.pricingTiers.length > 0 ? form.pricingTiers : null,
    abstractSubmission: buildAbstractSubmissionFromForm(form),
  };
}
