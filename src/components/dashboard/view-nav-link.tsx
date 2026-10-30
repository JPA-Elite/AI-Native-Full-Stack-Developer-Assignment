"use client";

import Link from "next/link";
import {
  isPlainLeftClick,
  useViewNavigation,
  viewHref,
  type View,
} from "@/components/dashboard/view-navigation";
import { cn } from "@/lib/utils";

export function ViewNavLink({
  view,
  activeView,
  matches,
  icon,
  children,
}: {
  view: View;
  activeView: View;
  matches: View[];
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const { pendingView, goToView } = useViewNavigation();
  const highlighted = pendingView ?? activeView;
  const active = matches.includes(highlighted);

  return (
    <Link
      href={viewHref(view)}
      onClick={(event) => {
        if (!isPlainLeftClick(event)) return;
        event.preventDefault();
        if (highlighted === view) return;
        goToView(view);
      }}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
        active
          ? "bg-surface text-ink shadow-[0_1px_2px_rgba(27,26,23,0.05)]"
          : "text-ink-soft hover:bg-surface/60 hover:text-ink",
      )}
    >
      <span className={cn("grid size-4 place-items-center", active ? "text-ink" : "text-ink-faint")}>
        {icon}
      </span>
      {children}
    </Link>
  );
}
