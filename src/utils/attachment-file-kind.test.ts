import { describe, expect, test } from "bun:test";
import attachmentFileKind from "./attachment-file-kind";

describe("attachmentFileKind", () => {
    test("reads the browser's type", () => {
        expect(attachmentFileKind({ mime: "image/png", name: "shot.png" })).toEqual({ media_type: "image", ext: "png" });
        expect(attachmentFileKind({ mime: "audio/mpeg", name: "memo.mp3" })).toEqual({ media_type: "audio", ext: "mp3" });
        expect(attachmentFileKind({ mime: "application/pdf", name: "a.pdf" })).toEqual({ media_type: "document", ext: "pdf" });
    });

    test("falls back to the name when the type is vague", () => {
        expect(attachmentFileKind({ mime: "", name: "notes.md" })).toEqual({ media_type: "document", ext: "md" });
        expect(attachmentFileKind({ mime: "application/octet-stream", name: "clip.m4a" })).toEqual({ media_type: "audio", ext: "m4a" });
    });

    test("keeps SVG as a document, not an image to resize", () => {
        expect(attachmentFileKind({ mime: "image/svg+xml", name: "logo.svg" }).media_type).toBe("document");
    });

    test("never stores a strange extension", () => {
        expect(attachmentFileKind({ mime: "", name: "noext" }).ext).toBe("bin");
        expect(attachmentFileKind({ mime: "", name: "x.p/../df" }).ext).toBe("df");
    });
});
