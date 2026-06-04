import type { ChapterEvent, PricingTier } from "@/types/event";
import type { ParticipantStatus } from "@/types/registration";

export function isConferenceEvent(event: ChapterEvent): boolean {
  return (event.pricingTiers?.length ?? 0) > 0;
}

export function getParticipantStatusOptions(): {
  value: ParticipantStatus;
  label: string;
}[] {
  return [
    { value: "member", label: "Member" },
    { value: "non_member", label: "Non-Member" },
    { value: "student", label: "Student (Undergraduate)" },
  ];
}

function labelMatchesStatus(label: string, status: ParticipantStatus): boolean {
  const normalized = label.toLowerCase();
  switch (status) {
    case "member":
      return normalized.includes("member") && !normalized.includes("non");
    case "non_member":
      return (
        normalized.includes("non-member") ||
        normalized.includes("non member") ||
        normalized.includes("nonmember")
      );
    case "student":
      return (
        normalized.includes("student") ||
        normalized.includes("students") ||
        normalized.includes("undergraduate")
      );
    default:
      return false;
  }
}

export function resolvePricingTier(
  event: ChapterEvent,
  participantStatus: ParticipantStatus
): PricingTier | null {
  const tiers = event.pricingTiers ?? [];
  return (
    tiers.find((tier) => labelMatchesStatus(tier.label, participantStatus)) ??
    null
  );
}

export function resolveAmountKobo(
  event: ChapterEvent,
  participantStatus?: ParticipantStatus | null
): number {
  if (participantStatus && isConferenceEvent(event)) {
    const tier = resolvePricingTier(event, participantStatus);
    if (tier) return tier.amountKobo;
  }
  return event.priceKobo;
}
