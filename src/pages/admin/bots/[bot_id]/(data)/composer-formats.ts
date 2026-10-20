import type { Editor } from "@tiptap/react";
import { Bold, Code, Italic, Link2, List, ListOrdered, Quote, Strikethrough, type LucideIcon } from "lucide-react";

type ComposerFormat = {
    /**
     * The mark or node it toggles, for `editor.isActive`.
     */
    name: string;
    title: string;
    Icon: LucideIcon;
    toggle: (params: { editor: Editor }) => void;
};

/**
 * The formatting the composer's selection bubble offers, in order.
 */
export const ComposerFormats: ComposerFormat[] = [
    { name: "bold", title: "Bold", Icon: Bold, toggle: ({ editor }) => editor.chain().focus().toggleBold().run() },
    { name: "italic", title: "Italic", Icon: Italic, toggle: ({ editor }) => editor.chain().focus().toggleItalic().run() },
    {
        name: "strike",
        title: "Strikethrough",
        Icon: Strikethrough,
        toggle: ({ editor }) => editor.chain().focus().toggleStrike().run(),
    },
    { name: "code", title: "Code", Icon: Code, toggle: ({ editor }) => editor.chain().focus().toggleCode().run() },
    { name: "link", title: "Link", Icon: Link2, toggle: toggleLink },
    {
        name: "blockquote",
        title: "Quote",
        Icon: Quote,
        toggle: ({ editor }) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
        name: "bulletList",
        title: "Bulleted list",
        Icon: List,
        toggle: ({ editor }) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        name: "orderedList",
        title: "Numbered list",
        Icon: ListOrdered,
        toggle: ({ editor }) => editor.chain().focus().toggleOrderedList().run(),
    },
];

/**
 * Removes the selection's link, or asks for one to set: web and mail
 * links only, `https://` added when there's no scheme.
 */
function toggleLink({ editor }: { editor: Editor }) {
    if (editor.isActive("link")) {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
    }

    const href = window.prompt("Link address")?.trim();

    if (!href) return;

    const has_scheme = /^[a-z][a-z0-9+.-]*:/i.test(href);

    if (has_scheme && !/^(https?|mailto):/i.test(href)) return;

    editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: has_scheme ? href : `https://${href}` })
        .run();
}
