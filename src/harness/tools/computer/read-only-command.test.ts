import { describe, expect, test } from "bun:test";
import isReadOnlyCommand from "./read-only-command";

/**
 * These decide whether an identical `computer_bash` call is answered from
 * its earlier answer instead of running again. Being wrong towards "reads"
 * would answer a read with what a different command printed, so the tests
 * lean on the side of the false cases: a shell can write in more ways than
 * this list knows, and an unrecognised one simply runs.
 */
describe("isReadOnlyCommand", () => {
    test("recognises the reads a run makes over and over", () => {
        for (const command of [
            "cat README.md",
            "head -n 40 src/server.ts",
            "grep -rn 'cache' src",
            "rg --files src/harness",
            "ls -la",
            "stat -c%s package.json",
            "du -sh node_modules",
            "wc -l src/server.ts",
            "jq '.version' package.json",
            "find . -name '*.test.ts' | head -20",
        ]) {
            expect({ command, reads: isReadOnlyCommand({ command }) }).toEqual({ command, reads: true });
        }
    });

    test("reads a git tree it only looks at", () => {
        for (const command of [
            "git log --oneline -5",
            "git -C /repo status --porcelain",
            "git -c core.pager=cat log",
            "git diff --stat",
            "git stash list",
            "git branch --show-current",
            "git remote -v",
            "git config --get user.name",
        ]) {
            expect({ command, reads: isReadOnlyCommand({ command }) }).toEqual({ command, reads: true });
        }
    });

    test("reads across a chain of reads, with or without a cd", () => {
        expect(isReadOnlyCommand({ command: "cd /repo && git status && cat package.json" })).toBe(true);
        expect(isReadOnlyCommand({ command: "ls src\ngit status" })).toBe(true);
        expect(isReadOnlyCommand({ command: "sudo cat /etc/os-release" })).toBe(true);
        expect(isReadOnlyCommand({ command: "FOO=1 grep x src/a.ts" })).toBe(true);
    });

    test("never calls a command that writes a read", () => {
        for (const command of [
            "rm -rf build",
            "cat a > b",
            "echo hi >> log.txt",
            "ls | tee out.txt",
            "sort -o sorted.txt in.txt",
            "date -s '2020-01-01'",
            "find . -name '*.tmp' -delete",
            "find . -name '*.ts' -exec rm {} ;",
            "git branch -D old",
            "git config user.name someone",
            "git stash pop",
            "sed -i 's/a/b/' file.ts",
        ]) {
            expect({ command, reads: isReadOnlyCommand({ command }) }).toEqual({ command, reads: false });
        }
    });

    test("doesn't call a shell invented by a substitution a read", () => {
        expect(isReadOnlyCommand({ command: "cat $(ls)" })).toBe(false);
        expect(isReadOnlyCommand({ command: "cat `ls`" })).toBe(false);
        expect(isReadOnlyCommand({ command: "ls && $(rm -rf .)" })).toBe(false);
    });

    test("treats a program it doesn't know as one that may write", () => {
        expect(isReadOnlyCommand({ command: "npm run build" })).toBe(false);
        expect(isReadOnlyCommand({ command: "python3 -c 'print(1)'" })).toBe(false);
        expect(isReadOnlyCommand({ command: "curl https://example.com" })).toBe(false);
        expect(isReadOnlyCommand({ command: "" })).toBe(false);
    });
});