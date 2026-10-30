import { Files, Users } from "lucide-react";
import { ViewNavLink } from "@/components/dashboard/view-nav-link";
import type { View } from "@/components/dashboard/view-navigation";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/user-menu";
import { DEMO_ACCOUNTS } from "@/lib/demo";
import type { PublicUser } from "@/lib/repo";

export function Sidebar({
  user,
  activeView,
}: {
  user: PublicUser;
  activeView: View;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-line bg-[#f1efe8] px-3.5 py-5 lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-8 space-y-0.5" aria-label="Workspace">
        <ViewNavLink
          view="all"
          activeView={activeView}
          matches={["all", "owned"]}
          icon={<Files className="size-4" />}
        >
          Documents
        </ViewNavLink>
        <ViewNavLink
          view="shared"
          activeView={activeView}
          matches={["shared"]}
          icon={<Users className="size-4" />}
        >
          Shared with me
        </ViewNavLink>
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
