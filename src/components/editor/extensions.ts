import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

/**
 * Deliberately narrow extension set. Everything here is stored as sanitized
 * HTML that the server already knows how to validate — no custom nodes that
 * would not survive a round trip through the API.
 */
export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      },
      codeBlock: {
        HTMLAttributes: { spellcheck: "false" },
      },
    }),
    Placeholder.configure({
      placeholder: "Start writing. Select text to format it, or press ⌘S to save.",
    }),
  ];
}
