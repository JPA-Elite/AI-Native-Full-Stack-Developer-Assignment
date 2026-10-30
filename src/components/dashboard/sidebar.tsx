import Link from "next/link";
import { Files, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/user-menu";
import { DEMO_ACCOUNTS } from "@/lib/demo";
import type { PublicUser } from "@/lib/repo";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  icon,
  children,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
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

export function Sidebar({
  user,
  activeView,
}: {
  user: PublicUser;
  activeView: "all" | "owned" | "shared";
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-line bg-[#f1efe8] px-3.5 py-5 lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-8 space-y-0.5" aria-label="Workspace">
        <NavLink
          href="/dashboard"
          icon={<Files className="size-4" />}
          active={activeView !== "shared"}
        >
          Documents
        </NavLink>
        <NavLink
          href="/dashboard?view=shared"
          icon={<Users className="size-4" />}
          active={activeView === "shared"}
        >
          Shared with me
        </NavLink>
      </nav>

      <div className="mt-9 px-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Workspace
        </p>
        <ul className="mt-3 space-y-2.5">
          {DEMO_ACCOUNTS.map((member) => (
            <li key={member.id} className="flex items-center gap-2.5">
              <Avatar name={member.name} color={member.color} size="xs" />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium leading-4 text-ink">
                  {member.name}
                  {member.id === user.id && (
                    <span className="ml-1.5 text-[10px] font-normal text-ink-faint">You</span>
                  )}
                </p>
                <p className="truncate text-[10.5px] leading-4 text-ink-faint">{member.email}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 rounded-xl border border-line/70 bg-surface/50 p-3">
        <p className="text-[11px] font-semibold text-ink-soft">Sharing is invite-only</p>
        <p className="mt-1 text-[11px] leading-[1.55] text-ink-faint">
          Add a workspace member as a viewer or editor from any document&rsquo;s Share dialog.
        </p>
      </div>

      <div className="mt-auto border-t border-line pt-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
