export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB body limit

export const IMPORT_EXTENSIONS = [".md", ".markdown", ".txt", ".docx"] as const;

export const ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".docx",
  ".xlsx",
  ".pptx",
  ".csv",
  ".md",
  ".txt",
  ".json",
  ".zip",
] as const;

const MIME_BY_EXTENSION: Record<string, string> = {
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".zip": "application/zip",
};

export function fileExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index === -1 ? "" : filename.slice(index).toLowerCase();
}

export function isImportable(filename: string): boolean {
  return (IMPORT_EXTENSIONS as readonly string[]).includes(fileExtension(filename));
}

export function isAttachable(filename: string): boolean {
  return (ATTACHMENT_EXTENSIONS as readonly string[]).includes(fileExtension(filename));
}

export function mimeTypeFor(filename: string, fallback = "application/octet-stream") {
  return MIME_BY_EXTENSION[fileExtension(filename)] ?? fallback;
}

/** Prevents path traversal and header injection in Content-Disposition. */
export function safeFilename(input: string): string {
  const base = input.split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || "file";
}

export function formatAcceptList(extensions: readonly string[]) {
  return extensions.join(", ");
}
