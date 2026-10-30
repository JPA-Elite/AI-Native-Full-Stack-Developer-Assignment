import sanitizeHtml from "sanitize-html";
import { marked } from "marked";
import mammoth from "mammoth";

export const MAX_DOCUMENT_HTML = 500_000;

const ALLOWED_TAGS = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "code",
  "pre",
  "blockquote",
  "hr",
  "a",
];

/**
 * Rich text is stored as sanitized HTML. The editor only produces this subset,
 * so narrowing on the way in keeps stored documents predictable and safe to
 * render for other users.
 */
export function sanitizeDocumentHtml(input: string): string {
  const cleaned = sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      b: "strong",
      i: "em",
      strike: "s",
    },
  }).trim();

  return cleaned || "<p></p>";
}

export function htmlFromMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false, gfm: true });
  return sanitizeDocumentHtml(html);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text keeps its paragraph breaks but never becomes markup. */
export function htmlFromPlainText(text: string): string {
  const blocks = text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return "<p></p>";

  return sanitizeDocumentHtml(
    blocks
      .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
      .join("\n"),
  );
}

export async function htmlFromDocx(buffer: Uint8Array): Promise<string> {
  const result = await mammoth.convertToHtml({
    buffer: Buffer.from(buffer),
  });
  return sanitizeDocumentHtml(result.value);
}

export function isEmptyHtml(html: string): boolean {
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length === 0 && !/<(hr|img)\b/i.test(html);
}
