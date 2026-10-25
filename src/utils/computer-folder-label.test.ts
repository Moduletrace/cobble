import { describe, expect, test } from "bun:test";
import computerFolderLabel from "./computer-folder-label";

const names = { bots: { "3": "Scout" }, users: { "7": "Ada Lovelace" }, workspaces: { "2": "Launch" } };

describe("computerFolderLabel", () => {
    test("names the id folders", () => {
        expect(computerFolderLabel({ path: "bots/3", names })).toBe("Scout");
        expect(computerFolderLabel({ path: "bots/3/users/7", names })).toBe("Ada Lovelace");
        expect(computerFolderLabel({ path: "workspaces/2", names })).toBe("Launch");
    });

    test("leaves everything else unnamed", () => {
        expect(computerFolderLabel({ path: "bots", names })).toBe("");
        expect(computerFolderLabel({ path: "bots/3/users", names })).toBe("");
        expect(computerFolderLabel({ path: "bots/3/users/7/seo", names })).toBe("");
        expect(computerFolderLabel({ path: "bots/9", names })).toBe("");
        expect(computerFolderLabel({ path: "other/3", names })).toBe("");
    });
});
