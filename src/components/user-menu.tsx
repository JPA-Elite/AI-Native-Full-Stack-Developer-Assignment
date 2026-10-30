"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import type { PublicUser } from "@/lib/repo";

export function UserMenu({ user, variant = "sidebar" }: { user: PublicUser; variant?: "sidebar" | "topbar" }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    setPending(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast({
        title: "Couldn't sign out",
        description: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
      setPending(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={
          variant === "sidebar"
            ? "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-paper"
            : "flex items-center gap-2 rounded-lg p-1 transition hover:bg-paper"
        }
      >
        <Avatar name={user.name} color={user.color} size="sm" />
        {variant === "sidebar" ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold leading-4 text-ink">
                {user.name}
              </span>
              <span className="block truncate text-[11px] leading-4 text-ink-faint">
                {user.email}
              </span>
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-ink-faint" />
          </>
        ) : null}
      </button>

      {open && (
        <div
          role="menu"
          className={`animate-panel absolute z-30 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl shadow-ink/10 ${
            variant === "sidebar" ? "bottom-full left-0 mb-1.5" : "right-0 top-full mt-1.5"
          }`}
        >
          <div className="px-2.5 py-2">
            <p className="text-[13px] font-semibold text-ink">{user.name}</p>
            <p className="text-[11px] text-ink-faint">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink-soft transition hover:bg-paper hover:text-ink disabled:opacity-50"
          >
            <LogOut className="size-4" />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
