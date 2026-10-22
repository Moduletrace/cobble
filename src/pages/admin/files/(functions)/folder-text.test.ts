import { describe, expect, test } from "bun:test";
import type { StorageFolderPayload } from "@/src/types";
import { emptyFolderText, folderSummary } from "./folder-text";

function folder(overrides: Partial<StorageFolderPayload> = {}): StorageFolderPayload {
    return {
        spec: { volume: "computers", owner_id: 1 },
        label: "Main computer",
        path: "seo/coderank",
        breadcrumbs: [],
        entries: [],
        total: 0,
        offset: 0,
        ...overrides,
    };
}

describe("folderSummary", () => {
    test("counts what is in the folder", () => {
        expect(folderSummary({ folder: folder({ total: 4 }) })).toContain("4 item(s)");
    });

    test("says a missing folder isn't on disk, not that it is empty", () => {
        const text = folderSummary({ folder: folder({ missing: true }) });

        expect(text).toContain("isn't on disk");
        expect(text).not.toContain("0 item(s)");
    });

    test("asks for a folder when there is none", () => {
        expect(folderSummary({ folder: null })).toBe("Pick a folder to look inside.");
    });
});

describe("emptyFolderText", () => {
    test("an empty folder says so", () => {
        expect(emptyFolderText({ folder: folder(), search: "" })).toBe("This folder is empty.");
    });

    test("a path that isn't there says so instead", () => {
        expect(emptyFolderText({ folder: folder({ missing: true }), search: "" })).toBe(
            "There's no seo/coderank in here. It may have been moved or deleted.",
        );
    });

    test("loading, an error and a search each win over the folder's own state", () => {
        expect(emptyFolderText({ folder: folder({ missing: true }), search: "", loading: true })).toBe(
            "Loading...",
        );
        expect(
            emptyFolderText({ folder: folder({ missing: true }), search: "", error: "Not found." }),
        ).toBe("Not found.");
        expect(emptyFolderText({ folder: folder({ missing: true }), search: "raw" })).toBe(
            'Nothing matches "raw".',
        );
    });
});
