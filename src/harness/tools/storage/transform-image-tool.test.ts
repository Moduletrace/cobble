import { describe, expect, test } from "bun:test";
import type { StorageToolContext } from "./storage-tool-context";
import transformImageTool from "./transform-image-tool";

/**
 * The tool must ask for at least one operation (M10): an empty list used to
 * slip past the per-operation dimension check, so an oversized source could
 * be decoded and re-encoded untouched. The schema now refuses it.
 */

const context = {
    user_id: 1,
    bot_id: 1,
    scopes: [{ scope: "bot", owner_id: 1 }],
} as unknown as StorageToolContext;

describe("transformImageTool schema (M10)", () => {
    test("refuses an empty operations list", () => {
        const tool = transformImageTool(context);

        expect(tool.schema!.safeParse({ file: "[file:1]", operations: [] }).success).toBe(false);
    });

    test("accepts a single operation", () => {
        const tool = transformImageTool(context);

        expect(tool.schema!.safeParse({ file: "[file:1]", operations: [{ op: "grayscale" }] }).success).toBe(true);
    });
});
