import { describe, expect, test } from "bun:test";
import fileRef, { fileRefId } from "./file-ref";
import linkComputerRefs from "./link-computer-refs";

describe("fileRef", () => {
    test("writes the ref the chat links", () => {
        expect(fileRef({ id: 12 })).toBe("[file:12]");
    });

    test("reads its id back", () => {
        expect(fileRefId({ href: "#file-12" })).toBe(12);
        expect(fileRefId({ href: "#file-0" })).toBeNull();
        expect(fileRefId({ href: "#bot-3" })).toBeNull();
        expect(fileRefId({ href: undefined })).toBeNull();
    });
});

describe("linkComputerRefs", () => {
    test("turns a file ref into a link", () => {
        expect(linkComputerRefs({ text: "Saved [file:12] there." })).toBe(
            "Saved [file 12](#file-12) there.",
        );
    });

    test("leaves an existing markdown link alone", () => {
        expect(linkComputerRefs({ text: "[file:12](#file-12)" })).toBe("[file:12](#file-12)");
    });

    test("still links the other refs", () => {
        const text = linkComputerRefs({ text: "[bot:3] [workspace:2] [computer:5]" });

        expect(text).toContain("(#bot-3)");
        expect(text).toContain("(#workspace-2)");
        expect(text).toContain("(#computer-5)");
    });
});
