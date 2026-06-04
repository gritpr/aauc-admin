"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type SnackbarVariant = "success" | "error";

type SnackbarItem = {
  message: string;
  variant: SnackbarVariant;
};

type SnackbarContextValue = {
  showSnackbar: (message: string, variant?: SnackbarVariant) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

function SnackbarToast({
  item,
  onDismiss,
}: {
  item: SnackbarItem;
  onDismiss: () => void;
}) {
  const isSuccess = item.variant === "success";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`pointer-events-auto flex min-w-[280px] max-w-md items-start gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ring-1 ring-black/5 ${
        isSuccess
          ? "bg-green-800 text-white"
          : "bg-red-800 text-white"
      }`}
    >
      <span className="mt-0.5 shrink-0" aria-hidden>
        {isSuccess ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </span>
      <p className="flex-1 leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 opacity-80 hover:opacity-100"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<SnackbarItem | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setItem(null);
  }, []);

  const showSnackbar = useCallback(
    (message: string, variant: SnackbarVariant = "success") => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setItem({ message, variant });
      timeoutRef.current = setTimeout(() => setItem(null), AUTO_DISMISS_MS);
    },
    [],
  );

  const showSuccess = useCallback(
    (message: string) => showSnackbar(message, "success"),
    [showSnackbar],
  );

  const showError = useCallback(
    (message: string) => showSnackbar(message, "error"),
    [showSnackbar],
  );

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, showSuccess, showError }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4"
      >
        {item && <SnackbarToast item={item} onDismiss={dismiss} />}
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return ctx;
}

/** Parse `{ error?: string }` from a failed fetch response. */
export async function getApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}
