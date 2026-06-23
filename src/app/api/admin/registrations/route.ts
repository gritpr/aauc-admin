import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api";
import {
  deleteRegistrations,
  listRegistrations,
  registrationsToCsv,
} from "@/services/registrations.admin";
import type { RegistrationStatus } from "@/types/registration";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") ?? undefined;
  const status = searchParams.get("status") as RegistrationStatus | undefined;
  const search = searchParams.get("search") ?? undefined;
  const format = searchParams.get("format");

  const registrations = await listRegistrations({ eventId, status, search });

  if (format === "csv") {
    const csv = registrationsToCsv(registrations);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="registrations-${eventId ?? "all"}.csv"`,
      },
    });
  }

  return NextResponse.json({ registrations });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { ids?: string[] };
  const ids = body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "At least one registration id is required" },
      { status: 400 },
    );
  }

  const result = await deleteRegistrations(ids);

  if (result.deleted === 0 && result.failed.length > 0) {
    return NextResponse.json(
      { error: "Failed to delete registrations", ...result },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
}
