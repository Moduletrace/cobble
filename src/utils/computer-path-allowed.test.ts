import { describe, expect, test } from "bun:test";
import computerPathAllowed from "./computer-path-allowed";

const member = { manages_crew: false, user_id: 7, bot_ids: [3], workspace_ids: [2] };

describe("computerPathAllowed", () => {
    test("crew managers see everything", () => {
        expect(computerPathAllowed({ ...member, manages_crew: true, path: "bots/9/users/1" })).toBe(true);
        expect(computerPathAllowed({ ...member, manages_crew: true, path: "legacy" })).toBe(true);
    });

    test("a member sees their bots and their own user folder", () => {
        expect(computerPathAllowed({ ...member, path: "" })).toBe(true);
        expect(computerPathAllowed({ ...member, path: "bots" })).toBe(true);
        expect(computerPathAllowed({ ...member, path: "bots/3" })).toBe(true);
        expect(computerPathAllowed({ ...member, path: "bots/3/notes.md" })).toBe(true);
        expect(computerPathAllowed({ ...member, path: "bots/3/users" })).toBe(true);
        expect(computerPathAllowed({ ...member, path: "bots/3/users/7/a" })).toBe(true);
        expect(computerPathAllowed({ ...member, path: "bots/3/users/8" })).toBe(false);
        expect(computerPathAllowed({ ...member, path: "bots/4" })).toBe(false);
        expect(computerPathAllowed({ ...member, path: "bots/03" })).toBe(false);
    });

    test("a member sees the workspaces they reach and nothing else at the root", () => {
        expect(computerPathAllowed({ ...member, path: "workspaces/2/x" })).toBe(true);
        expect(computerPathAllowed({ ...member, path: "workspaces/5" })).toBe(false);
        expect(computerPathAllowed({ ...member, path: ".cobble-workspace" })).toBe(false);
        expect(computerPathAllowed({ ...member, path: "other" })).toBe(false);
    });
});
