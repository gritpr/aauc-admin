import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdminSession } from "@/lib/api";
import { getAdminStorage } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const slug = String(formData.get("slug") ?? "event").toLowerCase();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const path = `events/${slug}/${filename}`;

    const bucket = getAdminStorage().bucket();
    const storageFile = bucket.file(path);

    await storageFile.save(buffer, {
      metadata: { contentType: file.type || "image/jpeg" },
    });

    await storageFile.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
