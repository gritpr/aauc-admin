export type RegistrationStatus =
  | "pending_payment"
  | "payment_received"
  | "cancelled";

export type ParticipantStatus = "member" | "non_member" | "student";

/** Serialized registration (ISO date strings — safe for RSC / client props). */
export interface Registration {
  id?: string;
  eventId: string;
  eventTitle: string;
  fullName: string;
  email: string;
  phone: string;
  status: RegistrationStatus;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  organization?: string | null;
  role?: string | null;
  cadre?: string | null;
  preferredNameOnCertificate?: string | null;
  photoUrl?: string | null;
  idDocUrl?: string | null;
  participantStatus?: ParticipantStatus | null;
  gender?: string | null;
  industry?: string | null;
  institution?: string | null;
  paystackReference?: string | null;
  paidAt?: string | null;
  emailSentAt?: string | null;
}
