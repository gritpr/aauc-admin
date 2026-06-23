import { getAdminStorage } from "@/lib/firebase/admin";

/** Extract object path from a public GCS / Firebase Storage URL. */
export function storagePathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "storage.googleapis.com") {
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length < 2) return null;
      return segments.slice(1).join("/");
    }
    return null;
  } catch {
    return null;
  }
}

function filenameFromPath(path: string): string {
  const name = path.split("/").pop();
  return name && name.length > 0 ? name : "download";
}

export async function downloadStorageFile(
  url: string,
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const path = storagePathFromPublicUrl(url);
  if (!path) {
    throw new Error("Invalid storage URL");
  }

  const file = getAdminStorage().bucket().file(path);
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error("File not found");
  }

  const [buffer] = await file.download();
  const [metadata] = await file.getMetadata();

  return {
    buffer,
    contentType: metadata.contentType ?? "application/octet-stream",
    filename: filenameFromPath(path),
  };
}

export async function deleteRegistrationStorageFiles(
  registrationId: string,
  urls: Array<string | null | undefined>,
): Promise<void> {
  const bucket = getAdminStorage().bucket();
  const paths = new Set<string>();

  for (const url of urls) {
    if (!url) continue;
    const path = storagePathFromPublicUrl(url);
    if (path) paths.add(path);
  }

  const [files] = await bucket.getFiles({
    prefix: `registrations/${registrationId}/`,
  });
  for (const file of files) {
    paths.add(file.name);
  }

  await Promise.all(
    [...paths].map((path) =>
      bucket
        .file(path)
        .delete()
        .catch(() => undefined),
    ),
  );
}
