"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage, useSnackbar } from "@/components/ui/Snackbar";
import {
  buildEventUpdatePatch,
  eventToForm,
  formToCreatePayload,
  type EventFormData,
} from "@/lib/events/form";
import { formatNaira, koboToNaira, nairaToKobo } from "@/lib/money";
import { getParticipantStatusOptions } from "@/lib/registration/pricing";
import type { ChapterEvent, PricingTier } from "@/types/event";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]";

export function EventForm({ event }: { event?: ChapterEvent }) {
  const router = useRouter();
  const initialForm = useRef<EventFormData>(eventToForm(event));
  const [form, setForm] = useState<EventFormData>(() => eventToForm(event));
  const { showSuccess, showError } = useSnackbar();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isConference = form.pricingTiers.length > 0;

  function update<K extends keyof EventFormData>(key: K, value: EventFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadImage(
    file: File,
    field: "imageUrl" | "flierImageUrl",
  ) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", form.slug || "event");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      showError(await getApiErrorMessage(res, "Image upload failed"));
      return;
    }
    const { url } = (await res.json()) as { url: string };
    update(field, url);
    showSuccess("Image uploaded");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const isUpdate = Boolean(event?.id);
    const body = isUpdate
      ? {
          action: "update",
          id: event!.id,
          patch: buildEventUpdatePatch(initialForm.current, form),
        }
      : {
          action: "create",
          ...formToCreatePayload(form),
        };

    if (isUpdate && Object.keys((body as { patch: object }).patch).length === 0) {
      setSaving(false);
      showError("No changes to save");
      return;
    }

    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      showError(await getApiErrorMessage(res, "Save failed"));
      return;
    }

    const data = (await res.json()) as { event: ChapterEvent };
    initialForm.current = eventToForm(data.event);
    showSuccess(isUpdate ? "Event saved successfully" : "Event created successfully");
    router.push(`/admin/events/${data.event.id}`);
    router.refresh();
  }

  function addTier() {
    update("pricingTiers", [
      ...form.pricingTiers,
      { label: "", amountKobo: 0, paymentLink: "" },
    ]);
  }

  function updateTier(index: number, patch: Partial<PricingTier>) {
    const tiers = [...form.pricingTiers];
    tiers[index] = { ...tiers[index]!, ...patch };
    update("pricingTiers", tiers);
  }

  function removeTier(index: number) {
    update(
      "pricingTiers",
      form.pricingTiers.filter((_, i) => i !== index),
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Slug" required>
            <input
              value={form.slug}
              onChange={(e) =>
                update(
                  "slug",
                  e.target.value.toLowerCase().replace(/\s+/g, "-"),
                )
              }
              className={inputClass}
              required
            />
          </Field>
          <Field label="Start date" required className="sm:col-span-1">
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="End date" required>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Location" required>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Venue (optional)">
            <input
              value={form.venue}
              onChange={(e) => update("venue", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Base price (₦)" required>
            <input
              type="number"
              min={0}
              value={form.priceNaira}
              onChange={(e) => update("priceNaira", Number(e.target.value))}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Capacity">
            <input
              type="number"
              min={0}
              value={form.capacity}
              onChange={(e) => update("capacity", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Status" className="sm:col-span-2">
            <select
              value={form.status}
              onChange={(e) =>
                update("status", e.target.value as "draft" | "published")
              }
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
        </div>
        <Field label="Description" required className="mt-4">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            className={inputClass}
            required
          />
        </Field>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Images</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField
            label="Card image URL"
            value={form.imageUrl}
            onChange={(v) => update("imageUrl", v)}
            onUpload={(f) => uploadImage(f, "imageUrl")}
            uploading={uploading}
          />
          <ImageField
            label="Flier / hero URL"
            value={form.flierImageUrl}
            onChange={(v) => update("flierImageUrl", v)}
            onUpload={(f) => uploadImage(f, "flierImageUrl")}
            uploading={uploading}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Conference pricing tiers
          </h2>
          <Button type="button" variant="secondary" onClick={addTier}>
            Add tier
          </Button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Add tiers to enable conference registration with Paystack Shop links.
        </p>
        {form.pricingTiers.map((tier, i) => (
          <div
            key={i}
            className="mb-4 grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:grid-cols-4"
          >
            <input
              placeholder="Label (e.g. Member)"
              value={tier.label}
              onChange={(e) => updateTier(i, { label: e.target.value })}
              className={inputClass}
            />
            <input
              type="number"
              placeholder="Amount ₦"
              value={koboToNaira(tier.amountKobo) || ""}
              onChange={(e) =>
                updateTier(i, {
                  amountKobo: nairaToKobo(Number(e.target.value)),
                })
              }
              className={inputClass}
            />
            <input
              placeholder="Paystack Shop URL"
              value={tier.paymentLink ?? ""}
              onChange={(e) => updateTier(i, { paymentLink: e.target.value })}
              className={`${inputClass} sm:col-span-2`}
            />
            <button
              type="button"
              onClick={() => removeTier(i)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        {isConference && (
          <div className="mt-4 rounded-lg bg-purple-50 p-4 text-sm">
            <p className="font-medium text-[var(--primary)]">Tier preview</p>
            <ul className="mt-2 space-y-1 text-gray-700">
              {getParticipantStatusOptions().map((opt) => {
                const match = form.pricingTiers.find((t) => {
                  const n = t.label.toLowerCase();
                  if (opt.value === "member")
                    return n.includes("member") && !n.includes("non");
                  if (opt.value === "non_member") return n.includes("non");
                  return (
                    n.includes("student") || n.includes("undergraduate")
                  );
                });
                return (
                  <li key={opt.value}>
                    {opt.label}:{" "}
                    {match
                      ? `${formatNaira(match.amountKobo)} → ${match.paymentLink || "no link"}`
                      : "no matching tier"}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Conference extras
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subtitle">
            <input
              value={form.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Theme">
            <input
              value={form.theme}
              onChange={(e) => update("theme", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Motto">
            <input
              value={form.motto}
              onChange={(e) => update("motto", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Accreditation">
            <input
              value={form.accreditation}
              onChange={(e) => update("accreditation", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Abstract submission
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Shown on the public event page for conference events. One format per
          line.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Keywords count">
            <input
              type="number"
              min={0}
              value={form.abstractKeywordsCount}
              onChange={(e) => update("abstractKeywordsCount", e.target.value)}
              className={inputClass}
              placeholder="e.g. 5"
            />
          </Field>
          <Field label="Word limit">
            <input
              type="number"
              min={0}
              value={form.abstractWordLimit}
              onChange={(e) => update("abstractWordLimit", e.target.value)}
              className={inputClass}
              placeholder="e.g. 250"
            />
          </Field>
          <Field label="Structure" className="sm:col-span-2">
            <input
              value={form.abstractStructure}
              onChange={(e) => update("abstractStructure", e.target.value)}
              className={inputClass}
              placeholder="Title, Aim, Objectives, IMRAD Format, and Recommendation"
            />
          </Field>
          <Field label="Formats" className="sm:col-span-2">
            <textarea
              value={form.abstractFormats}
              onChange={(e) => update("abstractFormats", e.target.value)}
              rows={3}
              className={inputClass}
              placeholder={"Oral Presentation\nPoster Presentation"}
            />
          </Field>
          <Field label="Guidelines" className="sm:col-span-2">
            <textarea
              value={form.abstractGuidelines}
              onChange={(e) => update("abstractGuidelines", e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="Send your submission to … and attach your registration payment receipt"
            />
          </Field>
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : event ? "Save changes" : "Create event"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/events")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  required,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  onUpload,
  uploading,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: (f: File) => void;
  uploading: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} mb-2`}
        placeholder="https://..."
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
        }}
        disabled={uploading}
        className="text-sm"
      />
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-24 rounded object-cover" />
      )}
    </div>
  );
}
