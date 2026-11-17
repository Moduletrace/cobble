import { describe, expect, test } from "bun:test";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import gitSnapshotScript, { GitSnapshotDir, KeepSnapshots } from "./git-snapshot-script";

/**
 * The snapshot a destructive git command triggers is only worth writing if it
 * can be applied back. That was checked against a real repository: a modified
 * file, a new file and a nested new file all came back with
 * `git -C <top> apply <patch>` after `git checkout -- .` and `git clean -fd`.
 * These tests pin the three things that made it work:
 *
 *  1. the patch is written outside the repository (in the bot's folder), so
 *     the command it guards cannot delete it;
 *  2. untracked files are in it (`git clean` is exactly what deletes those,
 *     and a new module was untracked in the run this guards);
 *  3. the paths inside it are relative to the repository root, which is what
 *     a `git apply` from that root needs.
 */

function dirs(overrides: Partial<ComputerRunDirs> = {}): ComputerRunDirs {
    return {
        workspace: "/home/cb-2/workspace",
        cwd: "/home/cb-2/workspace/users/1/cwv/main-site",
        bot_dir: "/home/cb-2/workspace/bots/2",
        shared_dir: null,
        roots: ["/home/cb-2/workspace/users/1"],
        user_id: 1,
        run_as: { bot_id: 2, workspace_id: null },
        ...overrides,
    };
}

describe("gitSnapshotScript", () => {
    test("writes the patch into the bot's folder, not the repository", () => {
        const script = gitSnapshotScript({ dirs: dirs() });

        expect(script).toContain(`dir='/home/cb-2/workspace/bots/2/${GitSnapshotDir}'`);
        expect(script).toContain(`patch="$dir/$(date +%Y%m%d-%H%M%S)-$$-$RANDOM-$(basename "$top").patch"`);
    });

    test("captures untracked files, not only the tracked diff", () => {
        const script = gitSnapshotScript({ dirs: dirs() });

        expect(script).toContain("git -c safe.directory='*' diff");
        expect(script).toContain("diff --cached");
        expect(script).toContain("ls-files --others --exclude-standard");
        expect(script).toContain('diff --no-index --binary -- /dev/null "$file"');
    });

    test("writes the patch from the repository root, so it applies from there", () => {
        const script = gitSnapshotScript({ dirs: dirs() });

        expect(script).toContain('top=$(git -C "$root" rev-parse --show-toplevel 2>/dev/null)');
        expect(script).toContain('cd "$top" || exit 0');
    });

    test("quotes the folder, so a path with a space stays one folder", () => {
        const script = gitSnapshotScript({
            dirs: dirs({ cwd: "/home/cb-2/workspace/users/1/my project" }),
        });

        expect(script).toContain(`root='/home/cb-2/workspace/users/1/my project'`);
    });

    test("keeps the newest snapshots and deletes the rest", () => {
        expect(KeepSnapshots).toBe(40);

        const script = gitSnapshotScript({ dirs: dirs() });

        expect(script).toContain(`tail -n +${KeepSnapshots + 1}`);
        // Prunes whole snapshots (a patch and its listing), not loose
        // entries, so it keeps KeepSnapshots patches rather than half (L7).
        expect(script).toContain(`ls -1t "$dir"/*.patch`);
        expect(script).toContain(`rm -f "$old" "$old.files"`);
    });

    test("writes nothing when the tree is clean, and never fails the call", () => {
        const script = gitSnapshotScript({ dirs: dirs() });

        expect(script).toContain('rm -f "$patch"');
        expect(script.trimEnd().endsWith("exit 0")).toBe(true);
    });

    test("saves every repository the command reaches, not only the cwd (M6)", () => {
        const script = gitSnapshotScript({
            dirs: dirs(),
            roots: [dirs().cwd, "/home/cb-2/workspace/users/1/other-repo"],
        });

        expect(script).toContain(`root='${dirs().cwd}'`);
        expect(script).toContain(`root='/home/cb-2/workspace/users/1/other-repo'`);
        // Each root is its own subshell, so a non-repository exits alone.
        expect(script.match(/top=\$\(git -C "\$root" rev-parse --show-toplevel/g)?.length).toBe(2);
    });

    test("captures ignored files too when a clean -x would delete them (M6)", () => {
        const script = gitSnapshotScript({ dirs: dirs(), include_ignored: true });

        expect(script).toContain("ls-files --others --ignored --exclude-standard");
    });

    test("leaves ignored files out of an ordinary snapshot", () => {
        expect(gitSnapshotScript({ dirs: dirs() })).not.toContain("--ignored");
    });
});