export const MAX_EVENT_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateEventImageFile(
  file: Pick<File, "type" | "size">,
): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file.";
  }
  if (file.size > MAX_EVENT_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}
