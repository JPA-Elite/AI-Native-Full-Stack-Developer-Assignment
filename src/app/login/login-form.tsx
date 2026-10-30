"use client";

import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(nextEmail: string, nextPassword: string, source: string) {
    setPending(source);
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
      setPending(null);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">Sign in to your workspace</h1>
        <p className="mt-1.5 text-sm leading-6 text-ink-soft">
          Use a demo account below, or enter the credentials shared in the README.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void signIn(email, password, "form");
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
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@ajaia.dev"
            className="h-10 w-full rounded-lg border border-line-strong/80 bg-surface px-3 text-sm text-ink shadow-[inset_0_1px_1px_rgba(27,26,23,0.03)] transition placeholder:text-ink-faint/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-medium text-ink">
              Password
            </label>
            <span className="text-[11px] text-ink-faint">Demo: {DEMO_PASSWORD}</span>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
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

        <Button type="submit" size="lg" className="w-full" disabled={pending !== null}>
          {pending === "form" ? (
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
          or continue as
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.id}
            type="button"
            disabled={pending !== null}
            onClick={() => void signIn(account.email, DEMO_PASSWORD, account.id)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition",
              "hover:border-line-strong hover:bg-paper/60 disabled:opacity-60",
            )}
          >
            <Avatar name={account.name} color={account.color} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-ink">{account.name}</span>
              <span className="block truncate text-[12px] text-ink-faint">{account.title}</span>
            </span>
            {pending === account.id ? (
              <Loader2 className="size-4 animate-spin text-ink-faint" />
            ) : (
              <ArrowRight className="size-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
            )}
          </button>
        ))}
      </div>

      <p className="mt-6 text-[12px] leading-5 text-ink-faint">
        This is a demo workspace. Accounts are seeded, data is shared, and every account uses the
        same password.
      </p>
    </div>
  );
}
