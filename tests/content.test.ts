import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  htmlFromDocx,
  htmlFromMarkdown,
  htmlFromPlainText,
  isEmptyHtml,
  sanitizeDocumentHtml,
} from "@/lib/content";

describe("sanitizeDocumentHtml", () => {
  it("keeps the formatting the editor produces", () => {
    const html =
      "<h1>Title</h1><p><strong>Bold</strong> <em>italic</em> <u>under</u></p><ul><li>One</li></ul><pre><code>code()</code></pre>";
    const result = sanitizeDocumentHtml(html);
    expect(result).toContain("<h1>Title</h1>");
    expect(result).toContain("<strong>Bold</strong>");
    expect(result).toContain("<em>italic</em>");
    expect(result).toContain("<u>under</u>");
    expect(result).toContain("<ul><li>One</li></ul>");
    expect(result).toContain("<pre><code>code()</code></pre>");
  });

  it("removes scripts, event handlers, and embedded frames", () => {
    const result = sanitizeDocumentHtml(
      '<p onclick="steal()">Hi</p><script>alert(1)</script><iframe src="https://evil.test"></iframe>',
    );
    expect(result).not.toContain("script");
    expect(result).not.toContain("iframe");
    expect(result).not.toContain("onclick");
    expect(result).toContain("Hi");
  });

  it("drops javascript: links but keeps safe ones", () => {
    const result = sanitizeDocumentHtml(
      '<p><a href="javascript:alert(1)">bad</a> <a href="https://ajaia.dev">good</a></p>',
    );
    expect(result).not.toContain("javascript:");
    expect(result).toContain('href="https://ajaia.dev"');
    expect(result).toContain('rel="noopener noreferrer nofollow"');
    expect(result).toContain('target="_blank"');
  });

  it("normalises legacy tags and empty documents", () => {
    expect(sanitizeDocumentHtml("<b>x</b> <i>y</i>")).toBe("<strong>x</strong> <em>y</em>");
    expect(sanitizeDocumentHtml("   ")).toBe("<p></p>");
    expect(sanitizeDocumentHtml("<script>bad()</script>")).toBe("<p></p>");
  });
});

describe("htmlFromMarkdown", () => {
  it("converts headings, lists, emphasis, and links", () => {
    const html = htmlFromMarkdown(
      "# Sprint notes\n\n- one\n- two\n\n**bold** and [a link](https://ajaia.dev)",
    );
    expect(html).toContain("<h1>Sprint notes</h1>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://ajaia.dev"');
  });

  it("cannot smuggle raw HTML through markdown", () => {
    const html = htmlFromMarkdown('Hello <img src=x onerror="alert(1)"> <script>alert(2)</script>');
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
    expect(html).toContain("Hello");
  });
});

describe("htmlFromDocx", () => {
  it("converts a Word document into editable HTML", async () => {
    const bytes = new Uint8Array(await readFile("tests/fixtures/import-sample.docx"));
    const html = await htmlFromDocx(bytes);
    expect(html).toContain("<strong>Imported from Word</strong>");
    expect(html).toContain("Body text &amp; more from a real .docx file.");
  });

  it("rejects files that are not real docx archives", async () => {
    await expect(htmlFromDocx(new Uint8Array([1, 2, 3, 4]))).rejects.toThrow();
  });
});

describe("htmlFromPlainText", () => {
  it("escapes markup and preserves paragraph breaks", () => {
    const html = htmlFromPlainText("First line\nsecond line\n\nSecond block & more");
    expect(html).toContain("<p>First line<br />second line</p>");
    expect(html).toContain("Second block &amp; more");
    expect(html).not.toContain("<script");
  });
});

describe("isEmptyHtml", () => {
  it("distinguishes blank documents from real content", () => {
    expect(isEmptyHtml("<p></p>")).toBe(true);
    expect(isEmptyHtml("<p> </p><p>&nbsp;</p>")).toBe(true);
    expect(isEmptyHtml("<p>Hello</p>")).toBe(false);
    expect(isEmptyHtml("<hr>")).toBe(false);
  });
});
