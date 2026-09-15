import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api";
import {
  deleteGalleryPhoto,
  updateGalleryPhoto,
} from "@/services/gallery.admin";
import type { GalleryPhotoPatch } from "@/types/gallery";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id, photoId } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: GalleryPhotoPatch = {};

  if ("caption" in body) patch.caption = String(body.caption ?? "").trim();

  if ("day" in body) {
    const day = Number(body.day);
    if (!Number.isInteger(day) || day < 1) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }
    patch.day = day;
  }

  if ("sortOrder" in body) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }
    patch.sortOrder = sortOrder;
  }

  try {
    const photo = await updateGalleryPhoto(id, photoId, patch);
    return NextResponse.json({ photo });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message.includes("not found") ? 404 : 500;
    if (status === 500) console.error("Gallery patch error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id, photoId } = await params;

  try {
    await deleteGalleryPhoto(id, photoId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    const status = message.includes("not found") ? 404 : 500;
    if (status === 500) console.error("Gallery delete error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
