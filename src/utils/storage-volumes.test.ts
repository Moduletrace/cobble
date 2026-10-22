import { describe, expect, test } from "bun:test";
import {
    StorageBrowserPath,
    isSameStorageSpec,
    isStorageVolume,
    parseStorageSpec,
    storagePathName,
    storageSpecHref,
    storageVolumeFromRef,
    storageVolumeLabel,
    storageVolumeNeedsOwner,
} from "./storage-volumes";

describe("parseStorageSpec", () => {
    test("reads a volume and its owner", () => {
        expect(parseStorageSpec({ volume: "computers", owner_id: "3" })).toEqual({
            volume: "computers",
            owner_id: 3,
        });
    });

    test("gives the database no owner", () => {
        expect(parseStorageSpec({ volume: "db", owner_id: "999" })).toEqual({
            volume: "db",
            owner_id: 0,
        });
    });

    test("refuses an unknown volume", () => {
        expect(parseStorageSpec({ volume: "secrets", owner_id: 1 })).toBeNull();
        expect(parseStorageSpec({ volume: "", owner_id: 1 })).toBeNull();
        expect(parseStorageSpec({ volume: null, owner_id: 1 })).toBeNull();
    });

    test("refuses a missing or bad owner", () => {
        expect(parseStorageSpec({ volume: "bots" })).toBeNull();
        expect(parseStorageSpec({ volume: "bots", owner_id: 0 })).toBeNull();
        expect(parseStorageSpec({ volume: "bots", owner_id: -2 })).toBeNull();
        expect(parseStorageSpec({ volume: "bots", owner_id: "abc" })).toBeNull();
        expect(parseStorageSpec({ volume: "bots", owner_id: "../../etc" })).toBeNull();
    });
});

describe("storageSpecHref", () => {
    test("builds the browser's address", () => {
        expect(storageSpecHref({ spec: { volume: "bots", owner_id: 3 } })).toBe(
            `${StorageBrowserPath}?volume=bots&owner=3`,
        );
    });

    test("adds and encodes a path", () => {
        expect(
            storageSpecHref({ spec: { volume: "computers", owner_id: 1 }, path: "/seo/raw mes/" }),
        ).toBe(`${StorageBrowserPath}?volume=computers&owner=1&path=seo%2Fraw+mes`);
    });
});

describe("volume names", () => {
    test("maps a folder ref's name to its volume", () => {
        expect(storageVolumeFromRef({ name: "computer" })).toBe("computers");
        expect(storageVolumeFromRef({ name: "bot" })).toBe("bots");
        expect(storageVolumeFromRef({ name: "nope" })).toBeNull();
        expect(storageVolumeFromRef({ name: null })).toBeNull();
    });

    test("knows which volumes need an owner", () => {
        expect(storageVolumeNeedsOwner({ volume: "db" })).toBe(false);
        expect(storageVolumeNeedsOwner({ volume: "media" })).toBe(true);
        expect(isStorageVolume("mcp")).toBe(true);
        expect(isStorageVolume("Media")).toBe(false);
    });

    test("labels a volume and a path", () => {
        expect(storageVolumeLabel({ volume: "mcp" })).toBe("MCP servers");
        expect(storagePathName({ volume: "computers", path: "seo/coderank/raw" })).toBe("raw");
        expect(storagePathName({ volume: "computers", path: "" })).toBe("Computers");
    });
});

describe("isSameStorageSpec", () => {
    test("compares volume and owner", () => {
        const a = { volume: "bots", owner_id: 1 } as const;

        expect(isSameStorageSpec({ a, b: { volume: "bots", owner_id: 1 } })).toBe(true);
        expect(isSameStorageSpec({ a, b: { volume: "bots", owner_id: 2 } })).toBe(false);
        expect(isSameStorageSpec({ a, b: { volume: "workspaces", owner_id: 1 } })).toBe(false);
        expect(isSameStorageSpec({ a, b: null })).toBe(false);
    });
});
