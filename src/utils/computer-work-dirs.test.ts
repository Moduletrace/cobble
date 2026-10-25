import { describe, expect, test } from "bun:test";
import computerRunDirs, { computerWorkspaceRelative, resolveComputerPath } from "./computer-work-dirs";

const W = "/home/gem/workspace";

describe("computerRunDirs", () => {
    test("a worker gets its own folder, the user's inside it", () => {
        const dirs = computerRunDirs({ bot_id: 3, user_id: 7 });

        expect(dirs.cwd).toBe(`${W}/bots/3/users/7`);
        expect(dirs.roots).toEqual([`${W}/bots/3`]);
        expect(dirs.shared_dir).toBeNull();
    });

    test("in a workspace the shared folder joins", () => {
        const dirs = computerRunDirs({ bot_id: 3, user_id: 7, workspace_id: 2 });

        expect(dirs.roots).toEqual([`${W}/bots/3`, `${W}/workspaces/2`]);
    });

    test("the coordinator reaches the whole workspace", () => {
        const dirs = computerRunDirs({ bot_id: 1, bot_kind: "coordinator", user_id: 1 });

        expect(dirs.roots).toEqual([W]);
    });
});

describe("resolveComputerPath", () => {
    const dirs = computerRunDirs({ bot_id: 3, user_id: 7, workspace_id: 2 });

    test("relative paths and ~ land in the user's folder", () => {
        expect(resolveComputerPath({ path: "seo/raw", dirs })).toBe(`${W}/bots/3/users/7/seo/raw`);
        expect(resolveComputerPath({ path: "~/a.txt", dirs })).toBe(`${W}/bots/3/users/7/a.txt`);
        expect(resolveComputerPath({ path: "~", dirs })).toBe(`${W}/bots/3/users/7`);
        expect(resolveComputerPath({ path: "", dirs })).toBe(`${W}/bots/3/users/7`);
    });

    test("absolute paths inside the roots pass", () => {
        expect(resolveComputerPath({ path: `${W}/bots/3/notes.md`, dirs })).toBe(`${W}/bots/3/notes.md`);
        expect(resolveComputerPath({ path: `${W}/workspaces/2/x/`, dirs })).toBe(`${W}/workspaces/2/x`);
    });

    test("anything outside is refused", () => {
        for (const path of [
            "/home/gem/x.txt",
            "/etc/passwd",
            "../../../4/a",
            "../8/secret",
            `${W}/bots/4`,
            `${W}/bots/3/users/8/a`,
            `${W}/bots/30`,
            `${W}/workspaces/5`,
            "~/../../../../x",
            "a\0b",
        ]) {
            expect(() => resolveComputerPath({ path, dirs })).toThrow();
        }
    });

    test("the bot-wide folder and its users folder itself pass", () => {
        expect(resolveComputerPath({ path: "..", dirs })).toBe(`${W}/bots/3/users`);
        expect(resolveComputerPath({ path: "../..", dirs })).toBe(`${W}/bots/3`);
    });

    test("the coordinator reaches any bot's folder", () => {
        const coordinator = computerRunDirs({ bot_id: 1, bot_kind: "coordinator", user_id: 1 });

        expect(resolveComputerPath({ path: `${W}/bots/3/report.md`, dirs: coordinator })).toBe(`${W}/bots/3/report.md`);
        expect(() => resolveComputerPath({ path: "/home/gem/.config", dirs: coordinator })).toThrow();
    });

    test("workspace-relative names", () => {
        expect(computerWorkspaceRelative({ absolute: `${W}/bots/3/users/7/seo` })).toBe("bots/3/users/7/seo");
    });
});
