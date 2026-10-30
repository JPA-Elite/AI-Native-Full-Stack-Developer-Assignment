"use client";

import {
  FileText,
  FolderOpen,
  Link2,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AccessBadge } from "@/components/access-badge";
import { ImportDialog } from "@/components/dashboard/import-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, MenuItem } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import type { DocumentSummary, PublicUser } from "@/lib/repo";
import { cn } from "@/lib/utils";

type View = "all" | "owned" | "shared";
type DocumentCardData = DocumentSummary & { updatedLabel: string };

const TABS: { key: View; label: string; short: string }[] = [
  { key: "all", label: "All documents", short: "All" },
  { key: "owned", label: "Owned by me", short: "Owned" },
  { key: "shared", label: "Shared with me", short: "Shared" },
];

export function DocumentBrowser({
  documents,
  activeView,
  user,
}: {
  documents: DocumentCardData[];
  activeView: View;
  user: PublicUser;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DocumentCardData | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [savingRename, setSavingRename] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentCardData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const owned = documents.filter((doc) => doc.access === "owner");
  const shared = documents.filter((doc) => doc.access !== "owner");

  const scoped = activeView === "owned" ? owned : activeView === "shared" ? shared : documents;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return scoped;
    return scoped.filter((doc) =>
      [doc.title, doc.preview, doc.ownerName]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, scoped]);

  const counts: Record<View, number> = {
    all: documents.length,
    owned: owned.length,
    shared: shared.length,
  };

  async function createDocument() {
    setCreating(true);
    try {
      const { id } = await apiFetch<{ id: string }>("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      router.push(`/doc/${id}`);
    } catch (error) {
      toast({
        title: "Couldn't create the document",
        description: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
      setCreating(false);
    }
  }

  function openRename(doc: DocumentCardData) {
    setRenameTarget(doc);
    setRenameValue(doc.title);
    setRenameError(null);
  }

  async function submitRename() {
    if (!renameTarget) return;
    const title = renameValue.trim();

    if (!title) {
      setRenameError("A document needs a title.");
      return;
    }
    if (title.length > 120) {
      setRenameError("Keep titles under 120 characters.");
      return;
    }

    setSavingRename(true);
    try {
      await apiFetch(`/api/documents/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setRenameTarget(null);
      toast({ title: "Renamed", tone: "success" });
      router.refresh();
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : "Rename failed.");
    } finally {
      setSavingRename(false);
    }
  }

  async function submitDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/documents/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      toast({ title: "Document deleted", description: "It has been removed for everyone.", tone: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Couldn't delete the document",
        description: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function copyLink(doc: DocumentCardData) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/doc/${doc.id}`);
      toast({ title: "Link copied", description: "Only people with access can open it.", tone: "success" });
    } catch {
      toast({ title: "Couldn't copy the link", tone: "error" });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Workspace
          </p>
          <h1 className="mt-1.5 font-serif text-[38px] leading-none tracking-tight text-ink">
            Documents
          </h1>
          <p className="mt-2.5 text-[13px] text-ink-soft">
            {documents.length} {documents.length === 1 ? "document" : "documents"} you can access
            {shared.length > 0 && (
              <>
                {" · "}
                <span className="text-ink">{shared.length} shared with you</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> Import
          </Button>
          <Button onClick={() => void createDocument()} disabled={creating}>
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            New document
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-b border-line sm:flex-row sm:items-center sm:justify-between">
        <nav
          className="scrollbar-thin -mb-px grid grid-cols-3 gap-2 sm:flex sm:gap-5 sm:overflow-x-auto"
          aria-label="Document filters"
        >
          {TABS.map((tab) => {
            const href = tab.key === "all" ? "/dashboard" : `/dashboard?view=${tab.key}`;
            const active = activeView === tab.key;
            return (
              <Link
                key={tab.key}
                href={href}
                className={cn(
                  "flex shrink-0 items-center justify-center gap-1.5 border-b-2 pb-2.5 text-[13px] font-medium transition sm:justify-start",
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-faint hover:border-line-strong hover:text-ink-soft",
                )}
              >
                <span className="sm:hidden">{tab.short}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold",
                    active ? "bg-paper-deep text-ink-soft" : "bg-paper-deep/60 text-ink-faint",
                  )}
                >
                  {counts[tab.key]}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="relative pb-2.5 sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-[calc(50%+5px)] text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents"
            aria-label="Search documents"
            className="h-8 w-full rounded-lg border border-line bg-surface pl-8 pr-7 text-[12.5px] text-ink transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-[calc(50%+5px)] rounded p-1 text-ink-faint hover:text-ink"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface/50 px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-paper-deep text-ink-faint">
            <FolderOpen className="size-5" />
          </span>
          <h2 className="mt-4 text-[15px] font-semibold text-ink">
            {query
              ? "No documents match your search"
              : activeView === "shared"
                ? "Nothing has been shared with you yet"
                : "No documents here yet"}
          </h2>
          <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-ink-soft">
            {query
              ? "Try a different title, owner, or phrase."
              : activeView === "shared"
                ? "When a teammate shares a document, it will appear here with a “Can view” or “Can edit” badge."
                : "Start from a blank page, or import a Markdown, text, or Word file."}
          </p>
          {query ? (
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setQuery("")}>
              Clear search
            </Button>
          ) : activeView !== "shared" ? (
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => void createDocument()} disabled={creating}>
                <Plus className="size-3.5" /> New document
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setImportOpen(true)}>
                <Upload className="size-3.5" /> Import a file
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((doc) => (
            <li
              key={doc.id}
              className="group relative flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 transition hover:border-line-strong hover:shadow-[0_2px_10px_rgba(27,26,23,0.04)] sm:gap-4 sm:px-4"
            >
              <span className="hidden size-9 shrink-0 place-items-center rounded-lg bg-paper text-ink-faint sm:grid">
                <FileText className="size-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/doc/${doc.id}`}
                    className="max-w-full truncate text-[13.5px] font-semibold text-ink after:absolute after:inset-0 after:rounded-xl after:content-[''] hover:underline hover:underline-offset-2"
                  >
                    {doc.title}
                  </Link>
                  <AccessBadge access={doc.access} />
                  {doc.collaboratorCount > 0 && (
                    <span
                      className="hidden items-center gap-1 text-[11px] text-ink-faint sm:inline-flex"
                      title={`${doc.collaboratorCount} collaborator${doc.collaboratorCount === 1 ? "" : "s"}`}
                    >
                      <Users className="size-3" />
                      {doc.collaboratorCount}
                    </span>
                  )}
                  {doc.attachmentCount > 0 && (
                    <span
                      className="hidden items-center gap-1 text-[11px] text-ink-faint sm:inline-flex"
                      title={`${doc.attachmentCount} attachment${doc.attachmentCount === 1 ? "" : "s"}`}
                    >
                      <Paperclip className="size-3" />
                      {doc.attachmentCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[12.5px] text-ink-faint">
                  {doc.access !== "owner" && (
                    <span className="font-medium text-ink-soft">{doc.ownerName} · </span>
                  )}
                  {doc.preview || "Empty document"}
                </p>
              </div>

              <div className="hidden w-36 shrink-0 flex-col items-end text-right md:flex">
                <span className="text-[12px] font-medium text-ink-soft">{doc.updatedLabel}</span>
                <span className="mt-0.5 text-[11px] text-ink-faint">
                  {doc.lastEditorName && doc.access !== "owner"
                    ? `Edited by ${doc.lastEditorName.split(" ")[0]}`
                    : doc.access === "owner"
                      ? "You"
                      : "Shared"}
                </span>
              </div>

              <div className="relative z-10">
                <DropdownMenu
                  label={`Actions for ${doc.title}`}
                  trigger={<MoreHorizontal className="size-4" />}
                  triggerClassName="size-8"
                >
                  {(close) => (
                    <>
                      <MenuItem
                        icon={<FileText className="size-4" />}
                        onClick={() => {
                          close();
                          router.push(`/doc/${doc.id}`);
                        }}
                      >
                        Open
                      </MenuItem>
                      <MenuItem
                        icon={<Link2 className="size-4" />}
                        onClick={() => {
                          close();
                          void copyLink(doc);
                        }}
                      >
                        Copy link
                      </MenuItem>
                      {doc.access === "owner" && (
                        <MenuItem
                          icon={<Pencil className="size-4" />}
                          onClick={() => {
                            close();
                            openRename(doc);
                          }}
                        >
                          Rename
                        </MenuItem>
                      )}
                      {doc.access === "owner" && (
                        <MenuItem
                          icon={<Trash2 className="size-4" />}
                          tone="danger"
                          onClick={() => {
                            close();
                            setDeleteTarget(doc);
                          }}
                        >
                          Delete
                        </MenuItem>
                      )}
                    </>
                  )}
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-[11.5px] text-ink-faint">
        Signed in as {user.name}. Documents you own show <span className="text-ink-soft">Owner</span>;
        shared documents show their access level.
      </p>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

      <Modal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Rename document"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameTarget(null)} disabled={savingRename}>
              Cancel
            </Button>
            <Button onClick={() => void submitRename()} disabled={savingRename}>
              {savingRename ? <Loader2 className="size-4 animate-spin" /> : "Save name"}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitRename();
          }}
        >
          <label htmlFor="rename-title" className="text-[12.5px] font-medium text-ink">
            Title
          </label>
          <input
            id="rename-title"
            value={renameValue}
            maxLength={120}
            onChange={(event) => {
              setRenameValue(event.target.value);
              setRenameError(null);
            }}
            className="mt-1.5 h-10 w-full rounded-lg border border-line-strong/80 bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
          {renameError && <p className="mt-2 text-[12.5px] text-danger">{renameError}</p>}
          <p className="mt-2 text-[11.5px] text-ink-faint">{renameValue.length}/120 characters</p>
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete this document?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void submitDelete()} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : "Delete document"}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-6 text-ink-soft">
          <span className="font-semibold text-ink">“{deleteTarget?.title}”</span> will be permanently
          deleted for you and everyone it is shared with, including its attachments. This cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}
