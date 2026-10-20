import { describe, expect, test } from "bun:test";
import Mention from "@tiptap/extension-mention";
import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { MentionMarkdown, mentionRef } from "./mention-markdown";

const markdown = new MarkdownManager({
    extensions: [StarterKit.configure({ heading: false }), Mention.extend(MentionMarkdown)],
});

const roundTrip = (text: string) => markdown.serialize(markdown.parse(text)).trim();

describe("mention markdown", () => {
    test("reads bot and workspace refs as mentions", () => {
        const doc = markdown.parse("Ask [bot:3] about [workspace:2]");
        const nodes = doc.content?.[0]?.content || [];
        const mentions = nodes.filter((node) => node.type == "mention");

        expect(mentions.map((node) => [node.attrs?.id, node.attrs?.mentionSuggestionChar])).toEqual([
            ["3", "@"],
            ["2", "#"],
        ]);
    });

    test("writes them back as refs, marks staying on the text around them", () => {
        expect(roundTrip("Ask [bot:3] about **[workspace:2] now**")).toBe("Ask [bot:3] about [workspace:2] **now**");
        expect(roundTrip("_Ask_ [bot:3] `soon`")).toBe("*Ask* [bot:3] `soon`");
        expect(roundTrip("> quoted\n\nreply to [bot:4]")).toBe("> quoted\n\nreply to [bot:4]");
    });

    test("leaves markdown links alone", () => {
        const doc = markdown.parse("[bot:3](https://example.com)");
        const nodes = doc.content?.[0]?.content || [];

        expect(nodes.some((node) => node.type == "mention")).toBe(false);
    });

    test("mentionRef defaults to a bot", () => {
        expect(mentionRef({ id: 5, char: "#" })).toBe("[workspace:5]");
        expect(mentionRef({ id: 5 })).toBe("[bot:5]");
    });
});
