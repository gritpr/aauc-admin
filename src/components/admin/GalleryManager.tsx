"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage, useSnackbar } from "@/components/ui/Snackbar";
import { toDate } from "@/lib/dates";
import type { GalleryPhoto } from "@/types/gallery";

interface GalleryManagerProps {
  eventId: string;
  startDate: string;
  endDate: string;
  initialPhotos: GalleryPhoto[];
  initialDayTitles: Record<string, string>;
  /** Conference day matching today, or 1 — resolved server-side. */
  defaultDay: number;
}

interface QueuedFile {
  key: string;
  file: File;
  previewUrl: string;
  caption: string;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dayCount(start: Date, end: Date): number {
  const ms = startOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function GalleryManager({
  eventId,
  startDate,
  endDate,
  initialPhotos,
  initialDayTitles,
  defaultDay,
}: GalleryManagerProps) {
  const { showSuccess, showError } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState(initialPhotos);
  const [dayTitles, setDayTitles] = useState(initialDayTitles);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [uploadDay, setUploadDay] = useState(defaultDay);
  const [uploading, setUploading] = useState(false);

  const days = useMemo(() => {
    const start = toDate(startDate) ?? new Date();
    const end = toDate(endDate) ?? start;
    const numbers = new Set<number>();
    for (let day = 1; day <= dayCount(start, end); day += 1) numbers.add(day);
    for (const photo of photos) if (photo.day >= 1) numbers.add(photo.day);

    return [...numbers]
      .sort((a, b) => a - b)
      .map((day) => ({
        day,
        date: addDays(startOfDay(start), day - 1),
        photos: photos.filter((photo) => photo.day === day),
      }));
  }, [photos, startDate, endDate]);

  const queueRef = useRef<QueuedFile[]>([]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Release previews only when the manager unmounts.
  useEffect(() => {
    return () =>
      queueRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  function handleFilesChosen(fileList: FileList | null) {
    if (!fileList?.length) return;
    setQueue((prev) => [
      ...prev,
      ...Array.from(fileList).map((file) => ({
        key: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        caption: "",
      })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFromQueue(key: string) {
    setQueue((prev) => {
      const item = prev.find((q) => q.key === key);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((q) => q.key !== key);
    });
  }

  async function handleUpload() {
    if (queue.length === 0) return;
    setUploading(true);

    const uploaded: GalleryPhoto[] = [];
    const uploadedKeys = new Set<string>();
    const failed: string[] = [];

    // Sequential: keeps the order stable and avoids hammering Storage.
    for (const item of queue) {
      const form = new FormData();
      form.set("file", item.file);
      form.set("caption", item.caption);
      form.set("day", String(uploadDay));

      try {
        const res = await fetch(`/api/admin/events/${eventId}/gallery`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          failed.push(await getApiErrorMessage(res, item.file.name));
          continue;
        }
        const data = (await res.json()) as { photo: GalleryPhoto };
        uploaded.push(data.photo);
        uploadedKeys.add(item.key);
        URL.revokeObjectURL(item.previewUrl);
      } catch {
        failed.push(item.file.name);
      }
    }

    setPhotos((prev) => [...prev, ...uploaded]);
    // Anything that failed stays in the queue so it can be retried.
    setQueue((prev) => prev.filter((item) => !uploadedKeys.has(item.key)));
    setUploading(false);

    if (uploaded.length > 0) {
      showSuccess(
        `${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} added to day ${uploadDay}`,
      );
    }
    if (failed.length > 0) showError(`${failed.length} upload(s) failed`);
  }

  async function saveCaption(photo: GalleryPhoto, caption: string) {
    const res = await fetch(
      `/api/admin/events/${eventId}/gallery/${photo.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      },
    );

    if (!res.ok) {
      showError(await getApiErrorMessage(res, "Could not save caption"));
      return;
    }

    const data = (await res.json()) as { photo: GalleryPhoto };
    setPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? data.photo : p)),
    );
    showSuccess("Caption saved");
  }

  async function movePhoto(photo: GalleryPhoto, day: number) {
    const res = await fetch(
      `/api/admin/events/${eventId}/gallery/${photo.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      },
    );

    if (!res.ok) {
      showError(await getApiErrorMessage(res, "Could not move photo"));
      return;
    }

    const data = (await res.json()) as { photo: GalleryPhoto };
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? data.photo : p)));
  }

  async function deletePhoto(photo: GalleryPhoto) {
    if (!confirm("Delete this photo? This removes it from the site and from storage.")) {
      return;
    }

    const res = await fetch(
      `/api/admin/events/${eventId}/gallery/${photo.id}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      showError(await getApiErrorMessage(res, "Could not delete photo"));
      return;
    }

    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    showSuccess("Photo deleted");
  }

  async function saveDayTitle(day: number, title: string) {
    const next = { ...dayTitles };
    if (title.trim()) next[String(day)] = title.trim();
    else delete next[String(day)];

    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        id: eventId,
        patch: { galleryDayTitles: next },
      }),
    });

    if (!res.ok) {
      showError(await getApiErrorMessage(res, "Could not save headline"));
      return;
    }

    setDayTitles(next);
    showSuccess("Headline saved");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Add photos</h2>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-gray-600">Conference day</span>
            <select
              value={uploadDay}
              onChange={(e) => setUploadDay(Number(e.target.value))}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {days.map((d) => (
                <option key={d.day} value={d.day}>
                  Day {d.day} — {d.date.toLocaleDateString("en-NG", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </option>
              ))}
            </select>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFilesChosen(e.target.files)}
            className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </div>

        {queue.length > 0 && (
          <>
            <ul className="mt-5 space-y-3">
              {queue.map((item) => (
                <li key={item.key} className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <textarea
                      value={item.caption}
                      onChange={(e) =>
                        setQueue((prev) =>
                          prev.map((q) =>
                            q.key === item.key
                              ? { ...q, caption: e.target.value }
                              : q,
                          ),
                        )
                      }
                      rows={2}
                      placeholder="Caption — what is happening in this photo?"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {item.file.name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => removeFromQueue(item.key)}
                    disabled={uploading}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading
                  ? "Uploading…"
                  : `Upload ${queue.length} photo${queue.length === 1 ? "" : "s"} to day ${uploadDay}`}
              </Button>
            </div>
          </>
        )}
      </section>

      {days.map((d) => (
        <section key={d.day} className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">
              Day {d.day}
              <span className="ml-2 font-normal text-gray-500">
                {d.date.toLocaleDateString("en-NG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </h2>
            <span className="text-xs text-gray-400">
              {d.photos.length} photo{d.photos.length === 1 ? "" : "s"}
            </span>
          </div>

          <DayTitleField
            key={dayTitles[String(d.day)] ?? ""}
            initial={dayTitles[String(d.day)] ?? ""}
            onSave={(title) => saveDayTitle(d.day, title)}
          />

          {d.photos.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400">
              No photos yet.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {d.photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  days={days.map((x) => x.day)}
                  onSaveCaption={(caption) => saveCaption(photo, caption)}
                  onMove={(day) => movePhoto(photo, day)}
                  onDelete={() => deletePhoto(photo)}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function DayTitleField({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (title: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const dirty = value.trim() !== initial.trim();

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Day headline, e.g. Opening ceremony and keynote"
        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <Button variant="secondary" disabled={!dirty} onClick={() => onSave(value)}>
        Save headline
      </Button>
    </div>
  );
}

function PhotoCard({
  photo,
  days,
  onSaveCaption,
  onMove,
  onDelete,
}: {
  photo: GalleryPhoto;
  days: number[];
  onSaveCaption: (caption: string) => void;
  onMove: (day: number) => void;
  onDelete: () => void;
}) {
  const [caption, setCaption] = useState(photo.caption);
  const dirty = caption.trim() !== photo.caption.trim();

  return (
    <li className="rounded-lg border border-gray-200 p-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={photo.imageUrl}
          alt={photo.caption || "Gallery photo"}
          fill
          className="object-cover"
          sizes="(min-width: 640px) 320px, 90vw"
        />
      </div>

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={2}
        placeholder="Caption"
        className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          disabled={!dirty}
          onClick={() => onSaveCaption(caption)}
        >
          Save
        </Button>
        <select
          value={photo.day}
          onChange={(e) => onMove(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
          aria-label="Move to day"
        >
          {days.map((day) => (
            <option key={day} value={day}>
              Day {day}
            </option>
          ))}
        </select>
        <Button variant="ghost" className="ml-auto text-red-600" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
}
