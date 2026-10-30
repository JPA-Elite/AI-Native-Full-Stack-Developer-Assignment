import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <Logo />
      <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
        404 — Not found
      </p>
      <h1 className="mt-3 max-w-md text-balance font-serif text-[34px] leading-tight tracking-tight text-ink">
        This document isn&rsquo;t here, or you don&rsquo;t have access.
      </h1>
      <p className="mt-3 max-w-sm text-[13px] leading-6 text-ink-soft">
        Documents are visible only to their owner and the people they invite. If a teammate shared
        it with you, sign in with the account they invited.
      </p>
      <div className="mt-7 flex gap-2">
        <Link href="/dashboard" className={buttonClass("primary", "md")}>
          Back to documents
        </Link>
        <Link href="/login" className={buttonClass("secondary", "md")}>
          Switch account
        </Link>
      </div>
    </main>
  );
}
