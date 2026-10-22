import { useEffect, useRef, useState } from "react";
import { Extension, ReactNodeViewRenderer, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import type { BotWithLastMessage, WorkspaceWithActivity } from "@/src/types";
import {
    ComposerMentionKinds,
    type ComposerMentionChar,
} from "../(data)/composer-mention-kinds";
import ComposerMentionChip from "../(partials)/composer-mention-chip";
import { MentionMarkdown, mentionRef } from "../(utils)/mention-markdown";
import shouldPastePlainText from "../(utils)/should-paste-plain-text";
import searchMentionItems, { type ComposerMentionItem } from "../(utils)/search-mention-items";

/**
 * The open mention menu: what matches what's typed after `@` or `#`, the
 * highlighted one, and how to pick one.
 */
export type ComposerMentionMenu = {
    char: ComposerMentionChar;
    items: ComposerMentionItem[];
    index: number;
    select: (item: ComposerMentionItem) => void;
};

type Params = {
    placeholder: string;
    bots: BotWithLastMessage[];
    workspaces: WorkspaceWithActivity[];
    /**
     * The message as markdown, on every change.
     */
    onChange: (params: { markdown: string }) => void;
    onSubmit: () => void;
    /**
     * Files pasted or dropped in.
     */
    onFiles: (params: { files: File[] }) => void;
};

/**
 * The composer's editor (Tiptap): markdown in and out, with bold, italic,
 * strike, code, lists, quotes and links (no headings), and mentions of
 * bots (`@`) and workspaces (`#`), written as their bot or workspace ref.
 * Enter sends and Shift+Enter breaks the line, except
 * in a code block or list, where Enter is the editor's and Mod+Enter
 * sends. Enter picks from an open mention menu. Pasted text comes in
 * plain, without another site's styling; pasted or dropped files go to
 * `onFiles`.
 */
export default function useComposerEditor({
    placeholder,
    bots,
    workspaces,
    onChange,
    onSubmit,
    onFiles,
}: Params) {
    const latest = useRef({ bots, workspaces, onChange, onSubmit, onFiles });
    latest.current = { bots, workspaces, onChange, onSubmit, onFiles };

    const [menu, setMenu] = useState<ComposerMentionMenu | null>(null);
    const menu_ref = useRef<ComposerMentionMenu | null>(null);
    const replaying_paste = useRef(false);

    const showMenu = (next: ComposerMentionMenu | null) => {
        menu_ref.current = next;
        setMenu(next);
    };

    const suggestion = (char: ComposerMentionChar): Omit<SuggestionOptions, "editor"> => ({
        char,
        allowSpaces: false,
        items: ({ query }) =>
            searchMentionItems({
                kind: ComposerMentionKinds[char],
                query,
                bots: latest.current.bots,
                workspaces: latest.current.workspaces,
            }),
        render: () => {
            const open = (props: SuggestionProps<ComposerMentionItem>) => {
                const index = menu_ref.current?.char == char ? menu_ref.current.index : 0;

                showMenu({
                    char,
                    items: props.items,
                    index: Math.min(index, Math.max(props.items.length - 1, 0)),
                    select: (item) => props.command({ id: String(item.id), label: item.label }),
                });
            };

            return {
                onStart: open,
                onUpdate: open,
                onExit: () => showMenu(null),
                onKeyDown: ({ event }) => moveMenu({ event }),
            };
        },
    });

    const moveMenu = ({ event }: { event: KeyboardEvent }) => {
        const current = menu_ref.current;

        if (!current?.items.length) return false;

        const count = current.items.length;

        if (event.key == "ArrowDown" || event.key == "ArrowUp") {
            const step = event.key == "ArrowDown" ? 1 : -1;

            showMenu({ ...current, index: (current.index + step + count) % count });
            return true;
        }

        const picked = current.items[current.index];

        if ((event.key == "Enter" || event.key == "Tab") && picked) {
            current.select(picked);
            return true;
        }

        return false;
    };

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: false,
                horizontalRule: false,
                underline: false,
                link: { openOnClick: false, autolink: true },
            }),
            Placeholder.configure({ placeholder }),
            Markdown,
            Mention.extend({
                ...MentionMarkdown,
                addNodeView() {
                    return ReactNodeViewRenderer(ComposerMentionChip, { as: "span" });
                },
            }).configure({
                renderText: ({ node }) =>
                    node.attrs.label
                        ? `${node.attrs.mentionSuggestionChar || "@"}${node.attrs.label}`
                        : mentionRef({ id: node.attrs.id, char: node.attrs.mentionSuggestionChar }),
                suggestions: [suggestion("@"), suggestion("#")],
            }),
            Extension.create({
                name: "composerKeys",
                addKeyboardShortcuts() {
                    const editorOwnsEnter = () =>
                        this.editor.isActive("codeBlock") || this.editor.isActive("listItem");

                    return {
                        Enter: () => {
                            if (menu_ref.current?.items.length || this.editor.view.composing) return false;
                            if (editorOwnsEnter()) return false;

                            latest.current.onSubmit();
                            return true;
                        },
                        "Mod-Enter": () => {
                            latest.current.onSubmit();
                            return true;
                        },
                    };
                },
            }),
        ],
        editorProps: {
            attributes: {
                role: "textbox",
                "aria-multiline": "true",
                "aria-label": placeholder,
                class: ComposerEditorClassName,
            },
            handlePaste: (view, event) => {
                /** `pasteText` re-runs this handler, so it must not send it round again. */
                if (replaying_paste.current) return false;

                const files = [...(event.clipboardData?.files || [])];

                if (files.length) {
                    latest.current.onFiles({ files });
                    return true;
                }

                const html = event.clipboardData?.getData("text/html") || "";
                const text = event.clipboardData?.getData("text/plain") || "";

                /** Our own copies keep their formatting; other sites' don't. */
                if (!shouldPastePlainText({ html, text })) return false;

                replaying_paste.current = true;

                try {
                    /**
                     * Without the event: `pasteText` re-asks every paste
                     * handler with the one it's given, and this one would
                     * replay the paste forever (a stack overflow), while a
                     * fresh event reads no clipboard data and falls through
                     * to the plain-text parse.
                     */
                    return view.pasteText(text);
                } finally {
                    replaying_paste.current = false;
                }
            },
            handleDrop: (_view, event) => {
                const files = [...(event.dataTransfer?.files || [])];

                if (!files.length) return false;

                event.preventDefault();
                latest.current.onFiles({ files });
                return true;
            },
        },
        onUpdate: ({ editor }) => {
            latest.current.onChange({ markdown: editorMarkdown({ editor }) });
        },
    });

    /**
     * Picking a mention with the pointer leaves the menu's state behind if
     * the editor goes before the suggestion exits.
     */
    useEffect(() => () => showMenu(null), [editor]);

    /**
     * Replaces the content with a draft, without reporting it as a change.
     */
    const setMarkdown = ({ markdown }: { markdown: string }) => {
        editor?.commands.setContent(markdown, { contentType: "markdown", emitUpdate: false });
    };

    const clear = () => {
        editor?.commands.clearContent(true);
    };

    /**
     * Puts dictated text at the cursor, spaced from what's around it.
     */
    const insertText = ({ text }: { text: string }) => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        const before = editor.state.doc.textBetween(Math.max(0, from - 1), from, "\n", " ");
        const after = editor.state.doc.textBetween(to, Math.min(editor.state.doc.content.size, to + 1), "\n", " ");
        const piece =
            (before && !/\s$/.test(before) ? " " : "") + text + (after && !/^\s/.test(after) ? " " : "");

        editor.chain().focus().insertContent(piece).run();
    };

    /**
     * Quotes text (one blockquote, a paragraph per line) at the cursor,
     * after any text selected in the editor (never over it), and leaves the
     * cursor in a fresh line after it.
     */
    const insertQuote = ({ text }: { text: string }) => {
        if (!editor) return;

        const lines = text.replace(/\r\n?/g, "\n").trim().split("\n");

        if (!lines.join("").trim()) return;

        editor
            .chain()
            .focus()
            .setTextSelection(editor.state.selection.to)
            .insertContent([
                {
                    type: "blockquote",
                    content: lines.map((line) => ({
                        type: "paragraph",
                        content: line.trim() ? [{ type: "text", text: line }] : [],
                    })),
                },
                { type: "paragraph" },
            ])
            .run();
    };

    return { editor, menu, setMarkdown, clear, insertText, insertQuote };
}

/**
 * The editor's markdown with Tiptap's empty-paragraph `&nbsp;` dropped and
 * blank lines at the ends trimmed.
 */
function editorMarkdown({ editor }: { editor: Editor }) {
    if (editor.isEmpty) return "";

    return editor
        .getMarkdown()
        .replace(/^&nbsp;$/gm, "")
        .replace(/^\s*\n|\n\s*$/g, "")
        .trimEnd();
}

/**
 * The editable area: the textarea's old type and growth (to 160px, then
 * it scrolls), with the chat's markdown look for what's formatted.
 */
const ComposerEditorClassName = [
    "min-h-5 max-h-[160px] overflow-y-auto outline-none text-sm leading-5 text-ink break-words",
    "[&_p]:m-0 [&_strong]:font-bold [&_em]:italic [&_s]:line-through [&_a]:underline [&_a]:underline-offset-2",
    "[&_code]:font-mono [&_code]:text-[13px] [&_code]:px-1 [&_code]:rounded-default-xs [&_code]:bg-sunken",
    "[&_pre]:my-1 [&_pre]:p-3 [&_pre]:rounded-default-sm [&_pre]:bg-sunken [&_pre]:whitespace-pre-wrap [&_pre_code]:p-0 [&_pre_code]:bg-transparent",
    "[&_ul]:my-0 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:my-0 [&_ol]:pl-5 [&_ol]:list-decimal",
    "[&_blockquote]:my-1 [&_blockquote]:pl-3 [&_blockquote]:border-0 [&_blockquote]:border-l-2 [&_blockquote]:border-solid [&_blockquote]:border-hairline-strong [&_blockquote]:text-ink-secondary",
    "[&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:text-ink-secondary",
].join(" ");
