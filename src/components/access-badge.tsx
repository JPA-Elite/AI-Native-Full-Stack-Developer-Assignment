import type { Access } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const STYLES: Record<Exclude<Access, null>, { label: string; className: string }> = {
  owner: { label: "Owner", className: "bg-paper-deep text-ink-soft" },
  editor: { label: "Can edit", className: "bg-accent-soft text-accent-strong" },
  viewer: { label: "Can view", className: "bg-amber-soft text-amber-ink" },
};

export function AccessBadge({
  access,
  className,
}: {
  access: Exclude<Access, null>;
  className?: string;
}) {
  const style = STYLES[access];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em]",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
