import type { Metadata } from "next";
import { DocumentBrowser } from "@/components/dashboard/document-browser";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/user-menu";
import { requireUser } from "@/lib/auth";
import { listDocumentsForUser } from "@/lib/repo";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Documents" };

type View = "all" | "owned" | "shared";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const rawView = Array.isArray(params.view) ? params.view[0] : params.view;
  const activeView: View = rawView === "owned" || rawView === "shared" ? rawView : "all";

  const documents = await listDocumentsForUser(user.id);
  const now = new Date();
  const cards = documents.map((document) => ({
    ...document,
    updatedLabel: formatRelative(document.updatedAt, now),
  }));

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar user={user} activeView={activeView} />

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
          <Logo />
          <UserMenu user={user} variant="topbar" />
        </header>

        <main className="mx-auto w-full max-w-[1120px] px-5 pb-24 pt-8 sm:px-8 lg:pt-14">
          <DocumentBrowser documents={cards} activeView={activeView} user={user} />
        </main>
      </div>
    </div>
  );
}
