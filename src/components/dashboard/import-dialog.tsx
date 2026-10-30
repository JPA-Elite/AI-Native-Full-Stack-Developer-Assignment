"use client";

import { AlertCircle, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { MAX_UPLOAD_BYTES, isImportable } from "@/lib/files";
import { cn, formatBytes } from "@/lib/utils";

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(next: File | null) {
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!isImportable(next.name)) {
      setError("Use a .md, .markdown, .txt, or .docx file.");
      return;
    }
    if (next.size > MAX_UPLOAD_BYTES) {
      setError(`That file is ${formatBytes(next.size)}. The limit is 4 MB.`);
      return;
    }
    setFile(next);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files?.[0] ?? null);
  }

  function reset() {
    setFile(null);
    setError(null);
    setPending(false);
    setDragging(false);
  }

  async function submit() {
    if (!file) {
      setError("Choose a file to import.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const result = await apiFetch<{ id: string; title: string }>("/api/import", {
        method: "POST",
        body: form,
      });
      reset();
      onClose();
      toast({ title: "Imported", description: `“${result.title}” is ready to edit.`, tone: "success" });
      router.push(`/doc/${result.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed. Try another file.");
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (pending) return;
        reset();
        onClose();
      }}
      title="Import a file"
      description="Turn a document into a new draft you can edit and share."
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!file || pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Importing…
              </>
            ) : (
              "Import document"
            )}
          </Button>
        </>
      }
    >
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition",
          dragging ? "border-accent bg-accent-soft/60" : "border-line-strong bg-paper/40",
        )}
      >
        {file ? (
          <>
            <span className="grid size-11 place-items-center rounded-xl bg-surface text-accent shadow-sm">
              <FileText className="size-5" />
            </span>
            <p className="mt-3 max-w-full truncate text-[13.5px] font-semibold text-ink">
              {file.name}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-faint">{formatBytes(file.size)}</p>
            <button
              type="button"
              onClick={() => choose(null)}
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline"
            >
              <X className="size-3" /> Choose a different file
            </button>
          </>
        ) : (
          <>
            <span className="grid size-11 place-items-center rounded-xl bg-surface text-ink-faint shadow-sm">
              <UploadCloud className="size-5" />
            </span>
            <p className="mt-3 text-[13.5px] font-semibold text-ink">
              Drop a file here, or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-accent underline underline-offset-2 hover:text-accent-strong"
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-[12px] leading-5 text-ink-faint">
              Markdown, plain text, or Word documents · up to 4 MB
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".md,.markdown,.txt,.docx"
          className="sr-only"
          onChange={(event) => choose(event.target.files?.[0] ?? null)}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[12.5px] leading-5 text-danger"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-1.5 text-[12px] leading-5 text-ink-faint">
        <li>• Headings, lists, emphasis, and links are preserved where the format supports them.</li>
        <li>• Images and comments are not imported — you can attach the original file instead.</li>
      </ul>
    </Modal>
  );
}
