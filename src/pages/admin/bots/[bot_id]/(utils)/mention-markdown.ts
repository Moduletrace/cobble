import type { JSONContent, MarkdownParseHelpers, MarkdownToken } from "@tiptap/core";
import {
    composerMentionChar,
    ComposerMentionKinds,
    type ComposerMentionChar,
} from "../(data)/composer-mention-kinds";

const RefPattern = /^\[(bot|workspace):(\d+)\](?!\()/;

/**
 * How the composer's mention node reads and writes markdown: a bot as
 * `[bot:3]` (`botRef`), a workspace as `[workspace:2]` (`workspaceRef`),
 * so a draft or a sent message holds the same refs bots write. A ref
 * followed by `(` is a markdown link, not a mention.
 */
export const MentionMarkdown = {
    markdownTokenizer: {
        name: "mention",
        level: "inline" as const,
        start(src: string) {
            const match = src.match(/\[(bot|workspace):\d+\](?!\()/);

            return match?.index ?? -1;
        },
        tokenize(src: string) {
            const match = src.match(RefPattern);

            if (!match) return undefined;

            const kind = match[1] as "bot" | "workspace";

            return {
                type: "mention",
                raw: match[0],
                attributes: { id: match[2], mentionSuggestionChar: composerMentionChar({ kind }) },
            };
        },
    },

    parseMarkdown(token: MarkdownToken, h: MarkdownParseHelpers) {
        return h.createNode("mention", { ...token.attributes, label: null });
    },

    renderMarkdown(node: JSONContent) {
        return mentionRef({
            id: node.attrs?.id,
            char: node.attrs?.mentionSuggestionChar,
        });
    },
};

/**
 * The ref a mention writes, `[bot:3]` unless it's a workspace's.
 */
export function mentionRef({ id, char }: { id?: string | number | null; char?: string | null }) {
    const kind = ComposerMentionKinds[(char || "@") as ComposerMentionChar] || "bot";

    return `[${kind}:${id}]`;
}
