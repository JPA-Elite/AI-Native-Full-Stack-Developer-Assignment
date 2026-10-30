import { describe, expect, it } from "vitest";
import {
  fileExtension,
  isAttachable,
  isImportable,
  mimeTypeFor,
  safeFilename,
} from "@/lib/files";

describe("upload policy", () => {
  it("only imports the documented formats", () => {
    expect(isImportable("notes.md")).toBe(true);
    expect(isImportable("notes.MARKDOWN")).toBe(true);
    expect(isImportable("notes.txt")).toBe(true);
    expect(isImportable("spec.docx")).toBe(true);
    expect(isImportable("spec.pdf")).toBe(false);
    expect(isImportable("archive.zip")).toBe(false);
    expect(isImportable("no-extension")).toBe(false);
  });

  it("allow-lists attachment types", () => {
    expect(isAttachable("brief.pdf")).toBe(true);
    expect(isAttachable("screenshot.PNG")).toBe(true);
    expect(isAttachable("deck.pptx")).toBe(true);
    expect(isAttachable("installer.exe")).toBe(false);
    expect(isAttachable("page.html")).toBe(false);
    expect(isAttachable("image.svg")).toBe(false);
  });

  it("derives extensions and mime types", () => {
    expect(fileExtension("Doc.Final.DOCX")).toBe(".docx");
    expect(fileExtension("no-dot")).toBe("");
    expect(mimeTypeFor("notes.md")).toBe("text/markdown");
    expect(mimeTypeFor("unknown.bin")).toBe("application/octet-stream");
    expect(mimeTypeFor("unknown.bin", "text/plain")).toBe("text/plain");
  });

  it("neutralises path traversal and header injection in filenames", () => {
    expect(safeFilename("../../etc/passwd")).toBe("passwd");
    expect(safeFilename("C:\\Users\\ada\\notes.md")).toBe("notes.md");
    expect(safeFilename('bad"name\n.md')).toBe("badname.md");
    expect(safeFilename("   ")).toBe("file");
  });
});
