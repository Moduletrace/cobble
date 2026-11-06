import { describe, expect, test } from "bun:test";
import computerRunDirs, { computerWorkspaceRelative, resolveComputerPath } from "./computer-work-dirs";

const W = "/home/gem/workspace";
const H = "/home/cb-3/workspace";

describe("computerRunDirs", () => {
    test("a worker works in its kept folder at home, the user's inside it", () => {
        const dirs = computerRunDirs({ bot_id: 3, user_id: 7 });

        expect(dirs.cwd).toBe(`${H}/users/7`);
        expect(dirs.bot_dir).toBe(H);
        expect(dirs.roots).toEqual([H]);
        expect(dirs.shared_dir).toBeNull();
    });

    test("in a workspace the shared folder joins, inside its own", () => {
        const dirs = computerRunDirs({ bot_id: 3, user_id: 7, workspace_id: 2 });

        expect(dirs.shared_dir).toBe(`${H}/workspaces/2`);
        expect(dirs.roots).toEqual([H, `${H}/workspaces/2`]);
    });

    test("the coordinator works in the computer's workspace and reaches all of it", () => {
        const dirs = computerRunDirs({ bot_id: 1, bot_kind: "coordinator", user_id: 1, workspace_id: 2 });

        expect(dirs.cwd).toBe(`${W}/bots/1/users/1`);
        expect(dirs.shared_dir).toBe(`${W}/workspaces/2`);
        expect(dirs.roots).toEqual([W]);
    });

    test("a worker works as its own account, with its workspace; the coordinator as the computer's user", () => {
        expect(computerRunDirs({ bot_id: 3, user_id: 7 }).run_as).toEqual({ bot_id: 3, workspace_id: null });
        expect(computerRunDirs({ bot_id: "3", user_id: 7, workspace_id: "2" }).run_as).toEqual({ bot_id: 3, workspace_id: 2 });
        expect(computerRunDirs({ bot_id: 1, bot_kind: "coordinator", user_id: 1, workspace_id: 2 }).run_as).toBeNull();
    });
});

describe("resolveComputerPath", () => {
    const dirs = computerRunDirs({ bot_id: 3, user_id: 7, workspace_id: 2 });

    test("relative paths and ~ land in the user's folder", () => {
        expect(resolveComputerPath({ path: "seo/raw", dirs })).toBe(`${H}/users/7/seo/raw`);
        expect(resolveComputerPath({ path: "~/a.txt", dirs })).toBe(`${H}/users/7/a.txt`);
        expect(resolveComputerPath({ path: "~", dirs })).toBe(`${H}/users/7`);
        expect(resolveComputerPath({ path: "", dirs })).toBe(`${H}/users/7`);
    });

    test("absolute paths inside the roots pass", () => {
        expect(resolveComputerPath({ path: `${H}/notes.md`, dirs })).toBe(`${H}/notes.md`);
        expect(resolveComputerPath({ path: `${H}/workspaces/2/x/`, dirs })).toBe(`${H}/workspaces/2/x`);
        expect(resolveComputerPath({ path: "workspaces/2", dirs: computerRunDirs({ bot_id: 3, user_id: 7, workspace_id: 2 }) })).toBe(
            `${H}/users/7/workspaces/2`,
        );
    });

    test("the real paths they link to pass too, given back as the bot sees them", () => {
        expect(resolveComputerPath({ path: `${W}/bots/3/users/7/a`, dirs })).toBe(`${H}/users/7/a`);
        expect(resolveComputerPath({ path: `${W}/workspaces/2/x`, dirs })).toBe(`${H}/workspaces/2/x`);
    });

    test("anything outside is refused", () => {
        for (const path of [
            "/home/gem/x.txt",
            "/home/cb-3/.cobble/env",
            "/home/cb-3",
            "/etc/passwd",
            "../../../4/a",
            "../8/secret",
            "../../..",
            `${W}/bots/4`,
            "/home/cb-4/workspace",
            `${H}/users/8/a`,
            `${W}/bots/3/users/8/a`,
            `${W}/bots/30`,
            `${W}/workspaces/5`,
            `${H}/workspaces/5`,
            "~/../../../../x",
            "a\0b",
        ]) {
            expect(() => resolveComputerPath({ path, dirs })).toThrow();
        }
    });

    test("outside a workspace no workspace folder is the run's", () => {
        const alone = computerRunDirs({ bot_id: 3, user_id: 7 });

        expect(() => resolveComputerPath({ path: `${H}/workspaces/2`, dirs: alone })).toThrow();
    });

    test("the bot-wide folder and its users folder itself pass", () => {
        expect(resolveComputerPath({ path: "..", dirs })).toBe(`${H}/users`);
        expect(resolveComputerPath({ path: "../..", dirs })).toBe(H);
    });

    test("the coordinator reaches any bot's folder, by either spelling", () => {
        const coordinator = computerRunDirs({ bot_id: 1, bot_kind: "coordinator", user_id: 1 });

        expect(resolveComputerPath({ path: `${W}/bots/3/report.md`, dirs: coordinator })).toBe(`${W}/bots/3/report.md`);
        expect(resolveComputerPath({ path: `${H}/report.md`, dirs: coordinator })).toBe(`${W}/bots/3/report.md`);
        expect(() => resolveComputerPath({ path: "/home/gem/.config", dirs: coordinator })).toThrow();
        expect(() => resolveComputerPath({ path: "/home/cb-3/.cobble", dirs: coordinator })).toThrow();
    });

    test("workspace-relative names", () => {
        expect(computerWorkspaceRelative({ absolute: `${W}/bots/3/users/7/seo` })).toBe("bots/3/users/7/seo");
        expect(computerWorkspaceRelative({ absolute: `${H}/users/7/seo` })).toBe("bots/3/users/7/seo");
        expect(computerWorkspaceRelative({ absolute: `${H}/workspaces/2/x` })).toBe("workspaces/2/x");
    });
});
