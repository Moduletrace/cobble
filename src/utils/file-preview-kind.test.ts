import { expect, test } from "bun:test";
import filePreviewKind from "./file-preview-kind";

test("filePreviewKind reads the extension first", () => {
    expect(filePreviewKind({ name: "report.md", media_type: "document" })).toBe("markdown");
    expect(filePreviewKind({ name: "seo/raw/Ranks.CSV" })).toBe("csv");
    expect(filePreviewKind({ name: "data.tsv" })).toBe("tsv");
    expect(filePreviewKind({ name: "chart.svg", media_type: "document" })).toBe("image");
    expect(filePreviewKind({ name: "paper.pdf" })).toBe("pdf");
    expect(filePreviewKind({ name: "page.html" })).toBe("html");
    expect(filePreviewKind({ name: "run.xml.out" })).toBe("text");
    expect(filePreviewKind({ name: "notes.json" })).toBe("text");
    expect(filePreviewKind({ name: "README" })).toBe("text");
});

test("filePreviewKind falls back to the media type", () => {
    expect(filePreviewKind({ name: "photo", media_type: "image" })).toBe("image");
    expect(filePreviewKind({ name: "clip", media_type: "video" })).toBe("video");
    expect(filePreviewKind({ name: "voice", media_type: "audio" })).toBe("audio");
    expect(filePreviewKind({ name: "archive.zip", media_type: "document" })).toBe("none");
    expect(filePreviewKind({ name: ".md" })).toBe("none");
    expect(filePreviewKind({})).toBe("none");
});
