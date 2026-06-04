"use client";

import { SnackbarProvider } from "@/components/ui/Snackbar";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SnackbarProvider>{children}</SnackbarProvider>;
}
