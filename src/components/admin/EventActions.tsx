"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage, useSnackbar } from "@/components/ui/Snackbar";
import type { EventStatus } from "@/types/event";

const successMessages: Record<string, string> = {
  publish: "Event published",
  unpublish: "Event unpublished",
  delete: "Event deleted",
};

export function EventActions({
  id,
  status,
}: {
  id: string;
  status: EventStatus;
}) {
  const router = useRouter();
  const { showSuccess, showError } = useSnackbar();

  async function runAction(action: string) {
    if (action === "delete" && !confirm("Delete this draft event?")) return;

    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id }),
    });

    if (!res.ok) {
      showError(await getApiErrorMessage(res, "Action failed"));
      return;
    }

    showSuccess(successMessages[action] ?? "Done");
    router.refresh();
    if (action === "delete") router.push("/admin/events");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" ? (
        <Button type="button" onClick={() => runAction("publish")}>
          Publish
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => runAction("unpublish")}
        >
          Unpublish
        </Button>
      )}
      {status === "draft" && (
        <Button type="button" variant="danger" onClick={() => runAction("delete")}>
          Delete
        </Button>
      )}
    </div>
  );
}
