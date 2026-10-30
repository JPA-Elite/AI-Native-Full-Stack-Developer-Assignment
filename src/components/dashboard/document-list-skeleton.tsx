import { cn } from "@/lib/utils";

/**
 * Placeholder rows for the dashboard list. Sized to match the real rows so the
 * page does not jump when the data arrives.
 */
export function DocumentListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("mt-4", className)} aria-busy="true">
      <span role="status" className="sr-only">
        Loading documents
      </span>
      <div aria-hidden className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 sm:gap-4 sm:px-4"
          >
            <div className="hidden size-9 shrink-0 animate-pulse rounded-lg bg-paper-deep/70 sm:block" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-2/5 animate-pulse rounded bg-paper-deep" />
              <div className="h-2.5 w-3/5 animate-pulse rounded bg-paper-deep/60" />
            </div>
            <div className="hidden w-28 shrink-0 space-y-1.5 md:block">
              <div className="ml-auto h-2.5 w-14 animate-pulse rounded bg-paper-deep/70" />
              <div className="ml-auto h-2 w-20 animate-pulse rounded bg-paper-deep/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
