import { NextResponse } from "next/server";
import { ApiError, apiUser, jsonError } from "@/lib/api";
import { htmlFromDocx, htmlFromMarkdown, htmlFromPlainText } from "@/lib/content";
import {
  IMPORT_EXTENSIONS,
  fileExtension,
  formatAcceptList,
  isImportable,
  safeFilename,
} from "@/lib/files";
import { createDocument } from "@/lib/repo";
import { titleFromFilename } from "@/lib/utils";
import { readUploadedFile } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await apiUser();
    const file = await readUploadedFile(request);
    const filename = safeFilename(file.name);

    if (!isImportable(filename)) {
      throw new ApiError(
        415,
        "unsupported_file_type",
        `Import supports ${formatAcceptList(IMPORT_EXTENSIONS)} files.`,
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = fileExtension(filename);
    const text = () => new TextDecoder().decode(bytes).replace(/^\uFEFF/, "");

    let html: string;
    if (extension === ".docx") {
      try {
        html = await htmlFromDocx(bytes);
      } catch {
        throw new ApiError(
          422,
          "unreadable_docx",
          "We couldn't read that .docx file. Re-save it in Word or Google Docs and try again.",
        );
      }
    } else if (extension === ".txt") {
      html = htmlFromPlainText(text());
    } else {
      html = htmlFromMarkdown(text());
    }

    const title = titleFromFilename(filename);
    const id = await createDocument(user.id, { title, content: html });

    return NextResponse.json({ id, title }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
