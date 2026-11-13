import { describe, expect, test } from "bun:test";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import computerWorkspaceSpace from "./computer-workspace-space";

const worker: ComputerRunDirs = {
    workspace: "/home/gem/workspace",
    cwd: "/home/cb-9/workspace/users/1",
    bot_dir: "/home/cb-9/workspace",
    shared_dir: null,
    roots: ["/home/cb-9/workspace"],
    user_id: 1,
    run_as: { bot_id: 9, workspace_id: null },
};

const coordinator: ComputerRunDirs = {
    ...worker,
    bot_dir: "/home/gem/workspace/bots/2",
    run_as: null,
};

const folders = (path: string) => [{ path, bytes: 22_000_000_000 }];

describe("computerWorkspaceSpace", () => {
    test("says nothing without a folder to name", () => {
        expect(computerWorkspaceSpace({ dirs: worker })).toBe(null);
        expect(computerWorkspaceSpace({ folders: [], dirs: worker })).toBe(null);
    });

    test("names the run's own folder as one it may clear", () => {
        const space = computerWorkspaceSpace({ folders: folders("bots/9"), dirs: worker });

        expect(space?.clearable).toBe(true);
        expect(space?.description).toContain("your own folder (bots/9");
    });

    test("names the workspace's shared folder as one it may clear", () => {
        const space = computerWorkspaceSpace({
            folders: folders("workspaces/3"),
            dirs: { ...worker, shared_dir: "/home/cb-9/workspace/workspaces/3", run_as: { bot_id: 9, workspace_id: 3 } },
        });

        expect(space?.clearable).toBe(true);
        expect(space?.description).toContain("this workspace's shared folder (workspaces/3");
    });

    test("a worker is told when the space is another bot's folder", () => {
        const space = computerWorkspaceSpace({ folders: folders("bots/3"), dirs: worker });

        expect(space?.clearable).toBe(false);
        expect(space?.description).toContain("another bot's folder");
    });

    test("a worker is told when the space is a workspace it isn't in", () => {
        const space = computerWorkspaceSpace({ folders: folders("workspaces/4"), dirs: worker });

        expect(space?.clearable).toBe(false);
        expect(space?.description).toContain("another workspace's folder");
    });

    test("the coordinator may clear any folder it is shown", () => {
        const space = computerWorkspaceSpace({ folders: folders("bots/3"), dirs: coordinator });

        expect(space?.clearable).toBe(true);
        expect(space?.description).toContain("which you can reach as the coordinator");
    });
});