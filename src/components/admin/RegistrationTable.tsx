"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage, useSnackbar } from "@/components/ui/Snackbar";
import { formatDateTime } from "@/lib/dates";
import { formatNaira } from "@/lib/money";
import type { Registration } from "@/types/registration";

export function RegistrationTable({
  registrations,
}: {
  registrations: Registration[];
}) {
  const router = useRouter();
  const { showSuccess, showError } = useSnackbar();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const selectableIds = useMemo(
    () =>
      registrations
        .map((registration) => registration.id)
        .filter((id): id is string => Boolean(id)),
    [registrations],
  );

  const allSelected =
    selectableIds.length > 0 && selectedIds.size === selectableIds.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(selectableIds) : new Set());
  }

  async function handleBulkDelete() {
    const count = selectedIds.size;
    if (count === 0) return;

    const confirmed = window.confirm(
      `Delete ${count} registration${count === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    const res = await fetch("/api/admin/registrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selectedIds] }),
    });
    setDeleting(false);

    if (!res.ok) {
      showError(await getApiErrorMessage(res, "Failed to delete registrations"));
      return;
    }

    const result = (await res.json()) as {
      deleted: number;
      notFound: string[];
      failed: { id: string; error: string }[];
    };

    setSelectedIds(new Set());

    if (result.failed.length > 0) {
      showError(
        `Deleted ${result.deleted}, but ${result.failed.length} failed. Refresh and try again.`,
      );
    } else if (result.notFound.length > 0) {
      showSuccess(
        `Deleted ${result.deleted}. ${result.notFound.length} were already removed.`,
      );
    } else {
      showSuccess(
        `Deleted ${result.deleted} registration${result.deleted === 1 ? "" : "s"}`,
      );
    }

    router.refresh();
  }

  return (
    <div className="mt-8">
      {selectedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-900">
            {selectedIds.size} selected
          </p>
          <Button
            type="button"
            variant="danger"
            className="text-xs"
            disabled={deleting}
            onClick={handleBulkDelete}
          >
            {deleting ? "Deleting…" : "Delete selected"}
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => toggleAll(e.target.checked)}
                  disabled={selectableIds.length === 0}
                  aria-label="Select all registrations"
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </th>
              <th className="px-4 py-3 font-medium">Registrant</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {registrations.map((reg) => {
              const id = reg.id;
              const isSelected = id ? selectedIds.has(id) : false;

              return (
                <tr
                  key={id ?? `${reg.email}-${reg.createdAt}`}
                  className={isSelected ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-gray-50"}
                >
                  <td className="px-4 py-3">
                    {id && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleOne(id, e.target.checked)}
                        aria-label={`Select ${reg.fullName}`}
                        className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {id ? (
                      <Link
                        href={`/admin/registrations/${id}`}
                        className="font-medium text-gray-900 hover:text-[var(--primary)]"
                      >
                        {reg.fullName}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">
                        {reg.fullName}
                      </span>
                    )}
                    <p className="text-xs text-gray-500">{reg.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{reg.eventTitle}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatNaira(reg.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateTime(reg.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={reg.status} />
                  </td>
                </tr>
              );
            })}
            {registrations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  No registrations match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
