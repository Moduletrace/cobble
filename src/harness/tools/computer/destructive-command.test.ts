import { describe, expect, test } from "bun:test";
import isDestructiveGit from "./destructive-command";

/**
 * These decide whether the tree is snapshotted before a command runs. A
 * false positive costs one cheap `git diff`; a false negative costs work
 * that no commit can bring back, so the cases below are the ones that
 * actually discard something.
 */
describe("isDestructiveGit", () => {
    test("recognises the calls that throw work away", () => {
        for (const command of [
            "git checkout -- .",
            "git checkout -- src/server.ts",
            "git checkout .",
            "git checkout -f main",
            "git restore src",
            "git reset --hard HEAD~1",
            "git clean -fd",
            "git stash",
            "git stash push -u -m wip",
            "git stash pop",
            "git stash drop",
            "git switch --discard-changes",
            "git rm -r src",
            "git worktree remove ../elsewhere",
        ]) {
            expect({ command, discards: isDestructiveGit({ command }) }).toEqual({ command, discards: true });
        }
    });

    test("sees the call past a cd, a prefix or git's own options", () => {
        expect(isDestructiveGit({ command: "cd ~/repo && git stash push -u" })).toBe(true);
        expect(isDestructiveGit({ command: "sudo git -C /repo reset --hard" })).toBe(true);
        expect(isDestructiveGit({ command: "git -c core.pager=cat stash" })).toBe(true);
    });

    test("leaves the calls that keep the work alone", () => {
        for (const command of [
            "git status",
            "git diff",
            "git log --oneline -5",
            "git stash list",
            "git stash show",
            "git clean -n",
            "git checkout main",
            "git checkout -b feature",
            "git switch main",
            "git reset --soft HEAD~1",
            "git add -A",
            "cd repo && npm run build",
        ]) {
            expect({ command, discards: isDestructiveGit({ command }) }).toEqual({ command, discards: false });
        }
    });
});