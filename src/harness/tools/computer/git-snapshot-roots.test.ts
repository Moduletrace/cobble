import { describe, expect, test } from "bun:test";
import { resolveComputerPath, type ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import gitSnapshotRoots from "./git-snapshot-roots";

/**
 * The snapshot must cover the repository the command actually touches. A
 * `git -C <dir>` or a `cd <dir> &&` reaches past the cwd, and each target is
 * collected so the safety patch is saved from the right tree (M6). The base
 * cwd is always kept; a target outside the run's folders is skipped.
 */

function dirs(): ComputerRunDirs {
    return {
        workspace: "/home/cb-2/workspace",
        cwd: "/home/cb-2/workspace/users/1/cwv/main-site",
        bot_dir: "/home/cb-2/workspace/bots/2",
        shared_dir: null,
        roots: ["/home/cb-2/workspace/users/1"],
        user_id: 1,
        run_as: { bot_id: 2, workspace_id: null },
    };
}

describe("gitSnapshotRoots", () => {
    test("keeps the base cwd when the command names no other directory", () => {
        expect(gitSnapshotRoots({ command: "git checkout -- .", dirs: dirs() })).toEqual([dirs().cwd]);
    });

    test("adds the repository a git -C reaches", () => {
        const roots = gitSnapshotRoots({ command: "git -C other checkout -- .", dirs: dirs() });

        expect(roots).toContain(dirs().cwd);
        expect(roots).toContain(resolveComputerPath({ path: "other", dirs: dirs() }));
    });

    test("adds the directory a cd changes into", () => {
        const roots = gitSnapshotRoots({ command: "cd ../sibling && git checkout -- .", dirs: dirs() });

        expect(roots).toContain(dirs().cwd);
        expect(roots).toContain(resolveComputerPath({ path: "../sibling", dirs: dirs() }));
    });

    test("skips a target outside the run's folders", () => {
        expect(gitSnapshotRoots({ command: "git -C /etc reset --hard", dirs: dirs() })).toEqual([dirs().cwd]);
    });

    test("collects several distinct targets once each", () => {
        const roots = gitSnapshotRoots({ command: "git -C other checkout -- . && git -C other reset --hard", dirs: dirs() });

        expect(roots.filter((root) => root == resolveComputerPath({ path: "other", dirs: dirs() })).length).toBe(1);
    });
});
