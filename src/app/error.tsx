"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
        Something went wrong
      </p>
      <h1 className="mt-3 max-w-md text-balance font-serif text-[32px] leading-tight tracking-tight text-ink">
        We hit an unexpected error.
      </h1>
      <p className="mt-3 max-w-sm text-[13px] leading-6 text-ink-soft">
        Your saved documents are safe. Try again, or head back to the dashboard.
      </p>
      <div className="mt-7 flex gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          Back to documents
        </Button>
      </div>
    </main>
  );
}
