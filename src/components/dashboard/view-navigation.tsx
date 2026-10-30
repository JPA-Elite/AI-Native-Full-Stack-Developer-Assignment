"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition, type MouseEvent, type ReactNode } from "react";

export type View = "all" | "owned" | "shared";

export function viewHref(view: View) {
  return view === "all" ? "/dashboard" : `/dashboard?view=${view}`;
}

/** True for clicks the browser should handle itself (new tab, download, etc.). */
export function isPlainLeftClick(event: MouseEvent<HTMLElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

type ViewNavigation = {
  pendingView: View | null;
  goToView: (view: View) => void;
};

const ViewNavigationContext = createContext<ViewNavigation | null>(null);

/**
 * The active view lives in the URL, so switching it is a server round trip. The
 * provider keeps that navigation inside a React transition so the tabs and the
 * sidebar can show a skeleton until the next view has rendered.
 */
export function ViewNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<View | null>(null);

  function goToView(view: View) {
    setTarget(view);
    startTransition(() => {
      router.push(viewHref(view), { scroll: false });
    });
  }

  return (
    <ViewNavigationContext.Provider value={{ pendingView: isPending ? target : null, goToView }}>
      {children}
    </ViewNavigationContext.Provider>
  );
}

export function useViewNavigation() {
  const context = useContext(ViewNavigationContext);
  if (!context) {
    throw new Error("useViewNavigation must be used inside ViewNavigationProvider");
  }
  return context;
}
