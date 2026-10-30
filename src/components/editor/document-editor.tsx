"use client";

import {
  ArrowLeft,
  Eye,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Share2,
  Trash2,
  Link2,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AttachmentsPanel } from "@/components/editor/attachments-panel";
import { createEditorExtensions } from "@/components/editor/extensions";
import { SaveStatus, type SaveState } from "@/components/editor/save-status";
import { ShareDialog } from "@/components/editor/share-dialog";
import { EditorToolbar } from "@/components/editor/toolbar";
import { AccessBadge } from "@/components/access-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, MenuItem } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch, ApiClientError } from "@/lib/client";
import { canEdit } from "@/lib/permissions";
import type { AttachmentMeta, Collaborator, DocumentDetail, PublicUser } from "@/lib/repo";
import { cn, wordCountFromHtml } from "@/lib/utils";

type Props = {
  user: PublicUser;
  document: DocumentDetail;
  workspaceUsers: PublicUser[];
};

export function DocumentEditor({ user, document, workspaceUsers }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const canWrite = canEdit(document.access);
  const owner = workspaceUsers.find((person) => person.id === document.ownerId);

  const [title, setTitle] = useState(document.title);
  const [status, setStatus] = useState<SaveState>("saved");
  const [wordCount, setWordCount] = useState(() => wordCountFromHtml(document.content));
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(document.collaborators);
  const [attachments, setAttachments] = useState<AttachmentMeta[]>(document.attachments);

  const titleRef = useRef(document.title);
  const contentRef = useRef(document.content);
  const savedTitleRef = useRef(document.title);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);

  const performSave = useCallback(async () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!dirtyRef.current) return;
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }

    const nextTitle = titleRef.current.trim() || savedTitleRef.current;
    const payload = { title: nextTitle, content: contentRef.current };

    inFlightRef.current = true;
    dirtyRef.current = false;
    setStatus("saving");

    try {
      await apiFetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      savedTitleRef.current = nextTitle;
      setStatus(dirtyRef.current ? "unsaved" : "saved");
    } catch (error) {
      dirtyRef.current = true;
      setStatus("error");

      if (error instanceof ApiClientError && error.status === 401) {
        router.replace("/login");
        return;
      }

      toast({
        title: "Couldn't save your changes",
        description:
          error instanceof Error ? error.message : "Check your connection and try again.",
        tone: "error",
      });
    } finally {
      inFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        void performSave();
      }
    }
  }, [document.id, router, toast]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setStatus("unsaved");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void performSave(), 800);
  }, [performSave]);

  const scheduleSaveRef = useRef(scheduleSave);

  useEffect(() => {
    scheduleSaveRef.current = scheduleSave;
  }, [scheduleSave]);

  const editor = useEditor({
    extensions: createEditorExtensions(),
    content: document.content,
    editable: canWrite,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "focus:outline-none",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: instance }) => {
      contentRef.current = instance.getHTML();
      setWordCount(wordCountFromHtml(contentRef.current));
      scheduleSaveRef.current();
    },
  });

  // Save on the way out (back button, tab close) and warn about unsaved work.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (!dirtyRef.current) return;
      try {
        void fetch(`/api/documents/${document.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: titleRef.current.trim() || savedTitleRef.current,
            content: contentRef.current,
          }),
          keepalive: true,
        });
      } catch {
        // Best effort only; the next edit will surface a real error.
      }
    };
  }, [document.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void performSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [performSave]);

  function handleTitleChange(value: string) {
    setTitle(value);
    titleRef.current = value;
    if (!canWrite) return;
    if (value.trim().length === 0) {
      setStatus("unsaved");
      return;
    }
    scheduleSave();
  }

  function handleTitleBlur() {
    if (!canWrite) return;
    if (titleRef.current.trim().length === 0) {
      titleRef.current = savedTitleRef.current;
      setTitle(savedTitleRef.current);
      setStatus(dirtyRef.current ? "unsaved" : "saved");
    }
  }

  async function removeDocument() {
    setDeleting(true);
    try {
      await apiFetch(`/api/documents/${document.id}`, { method: "DELETE" });
      dirtyRef.current = false;
      toast({ title: "Document deleted", tone: "success" });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast({
        title: "Couldn't delete the document",
        description: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
      setDeleting(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/doc/${document.id}`);
      toast({
        title: "Link copied",
        description: "Only people with access can open it.",
        tone: "success",
      });
    } catch {
      toast({ title: "Couldn't copy the link", tone: "error" });
    }
  }

  const people = [
    ...(owner ? [owner] : []),
    ...collaborators.filter((person) => person.id !== document.ownerId),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur sm:gap-3 sm:px-4">
        <Link
          href="/dashboard"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-paper hover:text-ink"
          aria-label="Back to documents"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-4 text-ink">
            {title || "Untitled document"}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[10.5px] leading-3 text-ink-faint">
            {document.access === "owner" ? "You own this document" : `Shared by ${document.ownerName}`}
            <span aria-hidden>·</span>
            <span>{document.access === "owner" ? "Owner" : document.access === "editor" ? "Can edit" : "Can view"}</span>
          </p>
        </div>

        {canWrite ? <SaveStatus state={status} /> : (
          <span className="hidden shrink-0 text-[11px] font-medium text-ink-faint sm:inline">
            Read-only
          </span>
        )}

        <div className="hidden items-center -space-x-2 sm:flex">
          {people.slice(0, 3).map((person) => (
            <Avatar key={person.id} name={person.name} color={person.color} size="sm" />
          ))}
          {people.length > 3 && (
            <span className="grid size-7 place-items-center rounded-full bg-paper-deep text-[10px] font-semibold text-ink-soft ring-2 ring-surface">
              +{people.length - 3}
            </span>
          )}
        </div>

        <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
          <Share2 className="size-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <button
          type="button"
          onClick={() => setPanelOpen((value) => !value)}
          aria-label="Toggle attachments"
          aria-pressed={panelOpen}
          className={cn(
            "relative grid size-8 shrink-0 place-items-center rounded-lg transition",
            panelOpen ? "bg-paper-deep text-ink" : "text-ink-soft hover:bg-paper hover:text-ink",
          )}
        >
          <Paperclip className="size-4" />
          {attachments.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-3.5 place-items-center rounded-full bg-ink px-1 text-[9px] font-semibold leading-3.5 text-paper">
              {attachments.length}
            </span>
          )}
        </button>

        <DropdownMenu
          label="Document actions"
          trigger={<MoreHorizontal className="size-4" />}
          triggerClassName="size-8"
        >
          {(close) => (
            <>
              <MenuItem
                icon={<Link2 className="size-4" />}
                onClick={() => {
                  close();
                  void copyLink();
                }}
              >
                Copy link
              </MenuItem>
              {document.access === "owner" && (
                <MenuItem
                  icon={<Trash2 className="size-4" />}
                  tone="danger"
                  onClick={() => {
                    close();
                    setDeleteOpen(true);
                  }}
                >
                  Delete document
                </MenuItem>
              )}
            </>
          )}
        </DropdownMenu>
      </header>

      <div className="flex flex-1">
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[840px] px-3 pb-28 pt-5 sm:px-6 lg:pt-8">
            {!canWrite && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#e8d9b8] bg-amber-soft px-3.5 py-2.5 text-[12px] leading-5 text-amber-ink">
                <Eye className="mt-0.5 size-4 shrink-0" />
                <span>
                  You have <strong>view-only</strong> access. Ask {owner?.name ?? "the owner"} for edit
                  access to make changes.
                </span>
              </div>
            )}

            {canWrite && editor && (
              <div className="sticky top-14 z-20 mb-4 py-1">
                <EditorToolbar editor={editor} />
              </div>
            )}

            <article className="rounded-2xl border border-line bg-surface px-5 py-7 shadow-[0_1px_3px_rgba(27,26,23,0.05)] sm:px-12 sm:py-11">
              <div className="flex items-start gap-3">
                {canWrite ? (
                  <input
                    aria-label="Document title"
                    value={title}
                    maxLength={120}
                    placeholder="Untitled document"
                    onChange={(event) => handleTitleChange(event.target.value)}
                    onBlur={handleTitleBlur}
                    className="w-full bg-transparent font-serif text-[30px] leading-[1.15] tracking-tight text-ink outline-none placeholder:text-ink-faint/50 sm:text-[38px]"
                  />
                ) : (
                  <h1 className="w-full font-serif text-[30px] leading-[1.15] tracking-tight text-ink sm:text-[38px]">
                    {title || "Untitled document"}
                  </h1>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-faint">
                <AccessBadge access={document.access} />
                <span aria-hidden>·</span>
                <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                <span aria-hidden>·</span>
                <span>{canWrite ? "Autosave on" : "Read-only"}</span>
              </div>

              <div className="my-6 h-px bg-line" />

              {editor ? (
                <div className="doc-editor">
                  <EditorContent editor={editor} />
                </div>
              ) : (
                <div className="space-y-3" aria-hidden>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-paper-deep" />
                  <div className="h-4 w-full animate-pulse rounded bg-paper-deep" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-paper-deep" />
                </div>
              )}
            </article>

            <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-ink-faint">
              <span>
                {canWrite ? "Changes save automatically · ⌘S to save now" : "Read-only view"}
              </span>
              <span>{wordCount} words</span>
            </div>
          </div>
        </main>

        {panelOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[1px] lg:hidden"
              onClick={() => setPanelOpen(false)}
              aria-hidden
            />
            <AttachmentsPanel
              documentId={document.id}
              attachments={attachments}
              canEdit={canWrite}
              onChange={setAttachments}
              onClose={() => setPanelOpen(false)}
            />
          </>
        )}
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        documentId={document.id}
        documentTitle={title || document.title}
        access={document.access}
        ownerId={document.ownerId}
        currentUser={user}
        workspaceUsers={workspaceUsers}
        collaborators={collaborators}
        onCollaboratorsChange={setCollaborators}
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this document?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void removeDocument()} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : "Delete document"}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-6 text-ink-soft">
          <span className="font-semibold text-ink">“{title}”</span> and its attachments will be
          permanently deleted for everyone. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
