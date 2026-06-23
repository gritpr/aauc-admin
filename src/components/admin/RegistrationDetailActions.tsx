"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage, useSnackbar } from "@/components/ui/Snackbar";

export function RegistrationDetailActions({
  id,
  fullName,
  photoUrl,
  idDocUrl,
}: {
  id: string;
  fullName: string;
  photoUrl?: string | null;
  idDocUrl?: string | null;
}) {
  const router = useRouter();
  const { showSuccess, showError } = useSnackbar();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete registration for ${fullName}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    const res = await fetch(`/api/admin/registrations/${id}`, {
      method: "DELETE",
    });
    setDeleting(false);

    if (!res.ok) {
      showError(await getApiErrorMessage(res, "Failed to delete registration"));
      return;
    }

    showSuccess("Registration deleted");
    router.push("/admin/registrations");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-6">
      {(photoUrl || idDocUrl) && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Downloads</h2>
          <div className="flex flex-wrap gap-3">
            {photoUrl && (
              <a
                href={`/api/admin/registrations/${id}/download?file=photo`}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
              >
                Download tag photo
              </a>
            )}
            {idDocUrl && (
              <a
                href={`/api/admin/registrations/${id}/download?file=idDoc`}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
              >
                Download ID document
              </a>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">Danger zone</h2>
        <p className="mt-1 text-sm text-red-800">
          Permanently remove this registration and any uploaded files.
        </p>
        <Button
          type="button"
          variant="danger"
          className="mt-4"
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? "Deleting…" : "Delete registrant"}
        </Button>
      </div>
    </div>
  );
}
