import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdminSession } from "@/lib/api";
import { getAdminStorage } from "@/lib/firebase/admin";
import { validateEventImageFile } from "@/lib/upload/event-image";
import { getEventById } from "@/services/events.admin";
import {
  addGalleryPhoto,
  listEventGallery,
  nextSortOrder,
} from "@/services/gallery.admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const photos = await listEventGallery(id);
  return NextResponse.json({ photos });
}

/** Uploads one photo to Storage, then records it against the event. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const caption = String(form.get("caption") ?? "").trim();
    const day = Number(form.get("day") ?? 1);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!Number.isInteger(day) || day < 1) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }

    const validationError = validateEventImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `events/${event.slug}/gallery/${randomUUID()}.${ext}`;

    const bucket = getAdminStorage().bucket();
    const storageFile = bucket.file(storagePath);

    await storageFile.save(Buffer.from(await file.arrayBuffer()), {
      metadata: { contentType: file.type || "image/jpeg" },
    });
    await storageFile.makePublic();

    const photo = await addGalleryPhoto(id, {
      day,
      caption,
      imageUrl: `https://storage.googleapis.com/${bucket.name}/${storagePath}`,
      storagePath,
      sortOrder: await nextSortOrder(id, day),
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (err) {
    console.error("Gallery upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
