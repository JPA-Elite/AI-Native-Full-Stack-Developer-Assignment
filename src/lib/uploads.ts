import { ApiError } from "./api";
import { MAX_UPLOAD_BYTES } from "./files";

/**
 * Reads a single multipart field. Vercel caps request bodies at ~4.5 MB, so we
 * reject anything above our own 4 MB ceiling before touching storage.
 */
export async function readUploadedFile(request: Request): Promise<File> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    throw new ApiError(
      415,
      "unsupported_media_type",
      "Uploads must be sent as multipart/form-data.",
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ApiError(400, "invalid_upload", "We couldn't read that upload. Try again.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "missing_file", "Choose a file first.");
  }
  if (file.size === 0) {
    throw new ApiError(400, "empty_file", "That file is empty.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(413, "file_too_large", "Files must be 4 MB or smaller.");
  }

  return file;
}
