import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-8 shrink-0 place-items-center rounded-[10px] bg-ink text-paper",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-4.5">
        <path
          d="M5.5 18.5 12 5.5l6.5 13"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8.5 14h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/dashboard",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Ajaia Docs home"
    >
      <LogoMark />
      {!compact && (
        <span className="flex items-baseline gap-1.5">
          <span className="font-serif text-[22px] leading-none tracking-tight text-ink">Ajaia</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            docs
          </span>
        </span>
      )}
    </Link>
  );
}
