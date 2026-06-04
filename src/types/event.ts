export type EventStatus = "draft" | "published";

export interface PricingTier {
  label: string;
  amountKobo: number;
  paymentLink?: string;
}

export interface EventTrack {
  title: string;
  topics: string[];
}

export interface AbstractSubmission {
  wordLimit?: number;
  structure?: string;
  keywordsCount?: number;
  formats?: string[];
  guidelines?: string;
}

export interface EventContact {
  name: string;
  phone: string;
}

/** Serialized event (ISO date strings — safe for RSC / client props). */
export interface ChapterEvent {
  id?: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  priceKobo: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  capacity?: number;
  imageUrl?: string;
  flierImageUrl?: string;
  subtitle?: string;
  theme?: string;
  motto?: string;
  accreditation?: string;
  venue?: string;
  pricingTiers?: PricingTier[];
  tracks?: EventTrack[];
  abstractSubmission?: AbstractSubmission;
  contacts?: EventContact[];
}

/** Firestore create payload (Date fields converted server-side). */
export type ChapterEventInput = {
  title: string;
  slug: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  priceKobo: number;
  status: EventStatus;
  capacity?: number | null;
  imageUrl?: string | null;
  flierImageUrl?: string | null;
  subtitle?: string | null;
  theme?: string | null;
  motto?: string | null;
  accreditation?: string | null;
  venue?: string | null;
  pricingTiers?: PricingTier[] | null;
  tracks?: EventTrack[] | null;
  abstractSubmission?: AbstractSubmission | null;
  contacts?: EventContact[] | null;
};

/** Partial Firestore update — only changed keys; null clears optional fields. */
export type ChapterEventPatch = Partial<ChapterEventInput>;
