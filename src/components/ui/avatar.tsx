import { cn, initials } from "@/lib/utils";

type AvatarProps = {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  title?: string;
};

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
};

export function Avatar({ name, color = "#2c6a51", size = "sm", className, title }: AvatarProps) {
  return (
    <span
      title={title ?? name}
      aria-label={name}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold uppercase tracking-wide text-white ring-2 ring-surface",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {initials(name)}
    </span>
  );
}
