import { describe, expect, test } from "bun:test";
import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { Marked, marked } from "marked";
import ComposerOrderedList from "./composer-ordered-list";

/**
 * The composer reads a draft or a recalled message back through the same
 * markdown manager its editor builds, extensions and all. Its own marked
 * instance, since Tiptap hands every manager the module-level one and a
 * manager built elsewhere (another test) would leave its tokenizers there.
 */
const manager = new MarkdownManager({
    marked: new Marked() as unknown as typeof marked,
    extensions: [StarterKit.configure({ orderedList: false }), ComposerOrderedList] as never,
});

const parse = ({ markdown }: { markdown: string }) => manager.parse(markdown) as {
    type: string;
    attrs?: { start?: number };
    content?: {
        type: string;
        attrs?: { start?: number };
        text?: string;
        content?: { type: string; text?: string }[];
    }[];
};

const text = ({ markdown }: { markdown: string }) => parse({ markdown }).content?.[0]?.content?.[0]?.text;

describe("composer ordered lists read digits only", () => {
    test("a sentence opening with a short word stays a paragraph", () => {
        const doc = parse({ markdown: "Ok. Do another pass on the browser." });

        expect(doc.content?.map((node) => node.type)).toEqual(["paragraph"]);
        expect(text({ markdown: "Ok. Do another pass on the browser." })).toBe(
            "Ok. Do another pass on the browser.",
        );
    });

    test("a two-letter word with a full stop stays a paragraph", () => {
        expect(parse({ markdown: "ab. xyz" }).content?.[0]?.type).toBe("paragraph");
    });

    test("a roman numeral marker stays a paragraph", () => {
        expect(parse({ markdown: "ii. second point" }).content?.[0]?.type).toBe("paragraph");
    });

    test("a digit marker is still an ordered list", () => {
        expect(parse({ markdown: "1. first\n2. second" }).content?.[0]?.type).toBe("orderedList");
    });

    test("a list keeps its start number", () => {
        expect(parse({ markdown: "10. tenth" }).content?.[0]?.attrs?.start).toBe(10);
    });

    test("a bullet list is untouched", () => {
        expect(parse({ markdown: "- one\n- two" }).content?.[0]?.type).toBe("bulletList");
    });
});