import { describe, expect, test } from "bun:test";
import { AccessExtensionKindSchema } from "./access-extension-kind-schema";
import { ExtensionKindSchema } from "./extension-kind-schema";

describe("extension kinds a coordinator names", () => {
    test("access takes a knowledgebase", () => {
        expect(AccessExtensionKindSchema.parse("knowledgebase")).toBe("knowledgebase");
        expect(AccessExtensionKindSchema.safeParse("bot").success).toBe(false);
    });

    /**
     * `delete_extension` picks what to delete by kind, and its last branch
     * deletes a custom tool: a knowledgebase reaching it would delete the
     * wrong thing.
     */
    test("the delete and list kinds still leave it out", () => {
        expect(ExtensionKindSchema.safeParse("knowledgebase").success).toBe(false);
        expect(ExtensionKindSchema.options).toEqual(["skill", "mcp", "tool"]);
    });
});