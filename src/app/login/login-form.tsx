"use client";

import { AlertCircle, ArrowRight, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { DEMO_ACCOUNTS } from "@/lib/demo";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The selected card is derived from the email so a typed address highlights
  // the matching account without a second source of truth.
  const selectedId =
    DEMO_ACCOUNTS.find(
      (account) => account.email.toLowerCase() === email.trim().toLowerCase(),
    )?.id ?? null;

  async function signIn(nextEmail: string, nextPassword: string) {
    setPending(true);
    setError(null);

    try {
      const { user } = await apiFetch<{ user: { name: string; email: string } }>(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: nextEmail, password: nextPassword }),
        },
      );

      // The provider lives in the root layout, so the toast survives the
      // client-side navigation to the dashboard.
      toast({
        title: `Welcome back, ${user.name.split(" ")[0]}`,
        description: `Signed in as ${user.email}.`,
        tone: "success",
      });

      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
      setPending(false);
    }
  }

  /** Fills the email only — the password is always typed by the reviewer. */
  function pickAccount(accountEmail: string) {
    setEmail(accountEmail);
    setError(null);
    passwordRef.current?.focus();
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">Sign in to your workspace</h1>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void signIn(email, password);
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            placeholder="you@ajaia.dev"
            className="h-10 w-full rounded-lg border border-line-strong/80 bg-surface px-3 text-sm text-ink shadow-[inset_0_1px_1px_rgba(27,26,23,0.03)] transition placeholder:text-ink-faint/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[13px] font-medium text-ink">
            Password
          </label>
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            placeholder="Enter your password"
            className="h-10 w-full rounded-lg border border-line-strong/80 bg-surface px-3 text-sm text-ink shadow-[inset_0_1px_1px_rgba(27,26,23,0.03)] transition placeholder:text-ink-faint/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-[13px] leading-5 text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Sign in <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          or pick an account
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2">
        {DEMO_ACCOUNTS.map((account) => {
          const selected = selectedId === account.id;
          return (
            <button
              key={account.id}
              type="button"
              aria-pressed={selected}
              disabled={pending}
              onClick={() => pickAccount(account.email)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60",
                selected
                  ? "border-accent/45 bg-accent-soft/50 ring-1 ring-accent/20"
                  : "border-line bg-surface hover:border-line-strong hover:bg-paper/60",
              )}
            >
              <Avatar name={account.name} color={account.color} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-ink">{account.name}</span>
                <span className="block truncate text-[12px] text-ink-faint">{account.title}</span>
              </span>
              {selected ? (
                <Check className="size-4 shrink-0 text-accent" aria-hidden />
              ) : (
                <span className="shrink-0 text-[11px] font-medium text-ink-faint transition group-hover:text-ink">
                  Use
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
