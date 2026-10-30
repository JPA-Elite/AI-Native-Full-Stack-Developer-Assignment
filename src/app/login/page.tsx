import type { Metadata } from "next";
import { Check } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/ui/logo";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

const HIGHLIGHTS = [
  "A focused rich-text editor that autosaves as you write.",
  "Import Markdown, text, or Word files into a new draft.",
  "Share with view or edit access, with clear ownership.",
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside
        className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 0% 0%, rgba(44,106,81,0.55) 0%, rgba(27,26,23,0) 55%), radial-gradient(90% 70% at 100% 100%, rgba(63,93,138,0.28) 0%, rgba(27,26,23,0) 60%)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-[10px] bg-paper text-ink">
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
          <span className="font-serif text-[22px] leading-none">Ajaia Docs</span>
        </div>

        <div className="max-w-[440px]">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-paper/45">
            Internal productivity tools
          </p>
          <h2 className="text-balance font-serif text-[42px] leading-[1.08] tracking-tight">
            Shared documents, without the ceremony.
          </h2>
          <p className="mt-5 max-w-[380px] text-[15px] leading-7 text-paper/65">
            A small, deliberate take on collaborative writing. Everything you need to draft,
            import, attach, and share — and nothing that gets in the way.
          </p>

          <ul className="mt-9 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13.5px] leading-6 text-paper/75">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-paper/10">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-[11px] text-paper/40">
          <span>Built for the Ajaia product exercise</span>
        </div>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-10 lg:py-14">
        <div className="lg:hidden">
          <Logo href="/login" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[400px]">
            <LoginForm />
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] text-ink-faint lg:mt-0">
          A demo workspace — seeded data, no external services required.
        </p>
      </main>
    </div>
  );
}
