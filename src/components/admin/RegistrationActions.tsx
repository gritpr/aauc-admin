"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage, useSnackbar } from "@/components/ui/Snackbar";
import type { RegistrationStatus } from "@/types/registration";

const statuses: { value: RegistrationStatus; label: string }[] = [
  { value: "pending_payment", label: "Pending payment" },
  { value: "payment_received", label: "Payment received" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

export function RegistrationActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: RegistrationStatus;
}) {
  const router = useRouter();
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: RegistrationStatus) {
    setLoading(true);
    const res = await fetch(`/api/admin/registrations/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);

    if (!res.ok) {
      showError(await getApiErrorMessage(res, "Failed to update status"));
      return;
    }

    const label = statuses.find((s) => s.value === status)?.label ?? status;
    showSuccess(`Status updated to ${label}`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <Button
          key={s.value}
          type="button"
          variant={s.value === currentStatus ? "primary" : "secondary"}
          disabled={loading || s.value === currentStatus}
          onClick={() => updateStatus(s.value)}
          className="text-xs"
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
