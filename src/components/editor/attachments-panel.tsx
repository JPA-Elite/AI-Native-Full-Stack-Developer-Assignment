"use client";

import {
  AlertCircle,
  Download,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import {
  ATTACHMENT_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  fileExtension,
  formatAcceptList,
  isAttachable,
} from "@/lib/files";
import type { AttachmentMeta } from "@/lib/repo";
import { cn, formatBytes } from "@/lib/utils";

function FileIcon({ filename }: { filename: string }) {
  const extension = fileExtension(filename);
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(extension)) {
    return <FileImage className="size-4" />;
  }
  if (extension === ".zip") return <FileArchive className="size-4" />;
  return <FileText className="size-4" />;
}

export function AttachmentsPanel({
  documentId,
  attachments,
  canEdit,
  onChange,
  onClose,
}: {
  documentId: string;
  attachments: AttachmentMeta[];
  canEdit: boolean;
  onChange: (next: AttachmentMeta[]) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const result = await apiFetch<{ attachments: AttachmentMeta[] }>(
      `/api/documents/${documentId}/attachments`,
    );
    onChange(result.attachments);
  }

  async function upload(file: File | null) {
    setError(null);
    if (!file) return;

    if (!isAttachable(file.name)) {
      setError(`Supported files: ${formatAcceptList(ATTACHMENT_EXTENSIONS)}.`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Files must be 4 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      await apiFetch(`/api/documents/${documentId}/attachments`, { method: "POST", body });
      await refresh();
      toast({ title: "Attachment added", tone: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(attachment: AttachmentMeta) {
    setDeleting(attachment.id);
    setError(null);
    try {
      await apiFetch(`/api/documents/${documentId}/attachments/${attachment.id}`, {
        method: "DELETE",
      });
      onChange(attachments.filter((item) => item.id !== attachment.id));
      toast({ title: "Attachment removed", tone: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't remove the attachment.");
    } finally {
      setDeleting(null);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void upload(event.dataTransfer.files?.[0] ?? null);
  }

  return (
    <aside
      aria-label="Attachments"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[350px] flex-col border-l border-line bg-surface shadow-2xl shadow-ink/10 lg:static lg:z-auto lg:w-[350px] lg:shrink-0 lg:shadow-none"
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 text-ink-faint" />
          <h2 className="text-[13px] font-semibold text-ink">Attachments</h2>
          <span className="rounded-full bg-paper-deep px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-soft">
            {attachments.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-m-1 rounded-md p-1 text-ink-faint transition hover:bg-paper hover:text-ink"
          aria-label="Close attachments panel"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
        {canEdit && (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "rounded-xl border border-dashed p-3.5 text-center transition",
              dragging ? "border-accent bg-accent-soft/60" : "border-line-strong bg-paper/40",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.docx,.xlsx,.pptx,.csv,.md,.txt,.json,.zip"
              onChange={(event) => void upload(event.target.files?.[0] ?? null)}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="w-full"
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {uploading ? "Uploading…" : "Attach a file"}
            </Button>
            <p className="mt-2 text-[11px] leading-4 text-ink-faint">
              Drag a file here, or browse. PDF, images, Office, zip · 4 MB max.
            </p>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-1.5 rounded-lg border border-danger/20 bg-danger-soft px-2.5 py-2 text-[11.5px] leading-5 text-danger"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}

        {attachments.length === 0 ? (
          <div className="mt-6 px-2 text-center">
            <span className="mx-auto grid size-10 place-items-center rounded-xl bg-paper text-ink-faint">
              <Paperclip className="size-4" />
            </span>
            <p className="mt-3 text-[12.5px] font-medium text-ink-soft">No attachments yet</p>
            <p className="mt-1 text-[11.5px] leading-5 text-ink-faint">
              Keep source files and references next to the writing.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-1.5">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="group flex items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-2"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-paper text-ink-faint">
                  <FileIcon filename={attachment.filename} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-ink" title={attachment.filename}>
                    {attachment.filename}
                  </p>
                  <p className="text-[10.5px] text-ink-faint">
                    {formatBytes(attachment.size)} · {attachment.uploaderName.split(" ")[0]}
                  </p>
                </div>
                <a
                  href={`/api/attachments/${attachment.id}`}
                  className="grid size-7 place-items-center rounded-md text-ink-faint transition hover:bg-paper hover:text-ink"
                  aria-label={`Download ${attachment.filename}`}
                  title="Download"
                >
                  <Download className="size-3.5" />
                </a>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => void remove(attachment)}
                    disabled={deleting === attachment.id}
                    className="grid size-7 place-items-center rounded-md text-ink-faint transition hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                    aria-label={`Delete ${attachment.filename}`}
                    title="Delete"
                  >
                    {deleting === attachment.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="border-t border-line px-4 py-3">
        <p className="text-[10.5px] leading-4 text-ink-faint">
          Stored with the document. Viewers can download attachments but not add or remove them.
        </p>
      </footer>
    </aside>
  );
}
