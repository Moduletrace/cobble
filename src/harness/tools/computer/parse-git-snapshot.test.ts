import { describe, expect, test } from "bun:test";
import parseGitSnapshot from "./parse-git-snapshot";

/**
 * The line comes from a shell script, so the parser has to survive the
 * trailing newline a `printf` adds and say nothing when the script printed
 * nothing (no repository, or nothing uncommitted).
 */
describe("parseGitSnapshot", () => {
    test("reads one snapshot per line", () => {
        const output = ["/home/gem/w/repo\t3\t/home/gem/b/.cobble/pre-destructive/x-repo.patch", ""].join("\n");

        expect(parseGitSnapshot({ output })).toEqual([
            {
                top: "/home/gem/w/repo",
                files: 3,
                patch: "/home/gem/b/.cobble/pre-destructive/x-repo.patch",
            },
        ]);
    });

    test("reads nothing from an empty output", () => {
        expect(parseGitSnapshot({ output: "" })).toEqual([]);
        expect(parseGitSnapshot({ output: "\n" })).toEqual([]);
    });

    test("keeps a snapshot whose count isn't a number", () => {
        const output = "/repo\t?\t/repo.patch\n";

        expect(parseGitSnapshot({ output })).toEqual([{ top: "/repo", files: 0, patch: "/repo.patch" }]);
    });

    test("skips a line without both ends", () => {
        expect(parseGitSnapshot({ output: "only-a-path\n" })).toEqual([]);
    });
});