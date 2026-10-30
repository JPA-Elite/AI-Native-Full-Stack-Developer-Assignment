"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";

export type SaveState = "saved" | "saving" | "unsaved" | "error";

const COPY: Record<SaveState, string> = {
  saved: "All changes saved",
  saving: "Saving…",
  unsaved: "Unsaved changes",
  error: "Couldn't save",
};

export function SaveStatus({ state }: { state: SaveState }) {
  return (
    <span
      role="status"
      aria-live="polite"
      title={COPY[state]}
      className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium text-ink-faint"
    >
      {state === "saved" && <Check className="size-3.5 text-accent" aria-hidden />}
      {state === "saving" && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {state === "unsaved" && (
        <span className="size-1.5 rounded-full bg-amber-ink" aria-hidden />
      )}
      {state === "error" && <AlertCircle className="size-3.5 text-danger" aria-hidden />}
      <span className="hidden sm:inline">{COPY[state]}</span>
    </span>
  );
}
