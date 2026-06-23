import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api";
import { downloadStorageFile } from "@/lib/registration/storage";
import { getRegistrationById } from "@/services/registrations.admin";

const FILE_TYPES = {
  photo: {
    field: "photoUrl" as const,
    downloadName: "tag-photo",
  },
  idDoc: {
    field: "idDocUrl" as const,
    downloadName: "id-document",
  },
};

function safeFilename(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const fileType = new URL(request.url).searchParams.get("file");

  if (fileType !== "photo" && fileType !== "idDoc") {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const registration = await getRegistrationById(id);
  if (!registration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = FILE_TYPES[fileType];
  const fileUrl = registration[config.field];
  if (!fileUrl) {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }

  try {
    const { buffer, contentType, filename } = await downloadStorageFile(fileUrl);
    const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
    const base = safeFilename(registration.fullName) || "registrant";
    const downloadName = `${base}-${config.downloadName}${ext}`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("Registration file download error:", err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
