import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api";
import {
  deleteRegistration,
  getRegistrationById,
  updateRegistrationStatus,
} from "@/services/registrations.admin";
import type { RegistrationStatus } from "@/types/registration";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const registration = await getRegistrationById(id);
  if (!registration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ registration });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as { status?: RegistrationStatus };

  if (!body.status) {
    return NextResponse.json({ error: "Status required" }, { status: 400 });
  }

  const valid: RegistrationStatus[] = [
    "pending_payment",
    "payment_received",
    "confirmed",
    "cancelled",
  ];
  if (!valid.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const registration = await updateRegistrationStatus(id, body.status);
  return NextResponse.json({ registration });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteRegistration(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete registration";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
