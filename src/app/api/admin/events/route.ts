import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api";
import { parseEventCreate, parseEventPatch } from "@/lib/events/parse";
import {
  createEvent,
  deleteEvent,
  getEventById,
  isSlugTaken,
  listAllEvents,
  setEventStatus,
  updateEvent,
} from "@/services/events.admin";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const events = await listAllEvents();
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown> & {
    action?: string;
    id?: string;
    patch?: Record<string, unknown>;
  };
  const action = body.action ?? "create";

  try {
    if (action === "list") {
      const events = await listAllEvents();
      return NextResponse.json({ events });
    }

    if (action === "checkSlug") {
      const slug = String(body.slug ?? "");
      const taken = await isSlugTaken(slug, body.id as string | undefined);
      return NextResponse.json({ taken });
    }

    if (action === "delete" && body.id) {
      const event = await getEventById(String(body.id));
      if (!event) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (event.status === "published") {
        return NextResponse.json(
          { error: "Unpublish before deleting" },
          { status: 400 },
        );
      }
      await deleteEvent(String(body.id));
      return NextResponse.json({ ok: true });
    }

    if (action === "publish" && body.id) {
      const event = await setEventStatus(String(body.id), "published");
      return NextResponse.json({ event });
    }

    if (action === "unpublish" && body.id) {
      const event = await setEventStatus(String(body.id), "draft");
      return NextResponse.json({ event });
    }

    if (action === "update" && body.id) {
      const patch = parseEventPatch(
        (body.patch as Record<string, unknown>) ?? {},
      );

      if (Object.keys(patch).length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 },
        );
      }

      if (patch.slug) {
        const taken = await isSlugTaken(patch.slug, String(body.id));
        if (taken) {
          return NextResponse.json(
            { error: "Slug already in use" },
            { status: 409 },
          );
        }
      }

      const event = await updateEvent(String(body.id), patch);
      return NextResponse.json({ event });
    }

    const input = parseEventCreate(body);

    if (!input.title || !input.slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 },
      );
    }

    const taken = await isSlugTaken(input.slug);
    if (taken) {
      return NextResponse.json(
        { error: "Slug already in use" },
        { status: 409 },
      );
    }

    const event = await createEvent(input);
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("Admin events error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
