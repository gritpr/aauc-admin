import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api";
import {
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
