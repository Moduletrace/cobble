import { describe, expect, test } from "bun:test";
import hostDirectoryDeletePaths from "./host-directory-delete-paths";

const cwd = "/home/cb-4/workspace/workspaces/5/proj";

function paths(command: string) {
    return hostDirectoryDeletePaths({ command, cwd });
}

describe("hostDirectoryDeletePaths", () => {
    test("rm takes every path it names, past its flags", () => {
        expect(paths("rm -rf build dist")).toEqual([
            { path: `${cwd}/build`, kind: "delete" },
            { path: `${cwd}/dist`, kind: "delete" },
        ]);
    });

    test("a quoted path with spaces stays one path", () => {
        expect(paths("rm \"my notes/today.txt\"")).toEqual([
            { path: `${cwd}/my notes/today.txt`, kind: "delete" },
        ]);
    });

    test("an absolute path is kept as it is", () => {
        expect(paths("rm -f /home/gem/workspace/workspaces/5/proj/a.log")).toEqual([
            { path: "/home/gem/workspace/workspaces/5/proj/a.log", kind: "delete" },
        ]);
    });

    test("a flag-looking path after -- is a path", () => {
        expect(paths("rm -- -old.log")).toEqual([{ path: `${cwd}/-old.log`, kind: "delete" }]);
    });

    test("prefix words are read past", () => {
        expect(paths("sudo rm -rf a && xargs rm b")).toEqual([
            { path: `${cwd}/a`, kind: "delete" },
            { path: `${cwd}/b`, kind: "delete" },
        ]);
    });

    test("find -delete takes its starting point, not its tests", () => {
        expect(paths("find . -name '*.log' -delete")).toEqual([{ path: cwd, kind: "delete" }]);
        expect(paths("find /tmp/x -type f -exec rm {} +")).toEqual([{ path: "/tmp/x", kind: "delete" }]);
    });

    test("a stdout redirect empties the file; an append does not", () => {
        expect(paths("echo done > report.md")).toEqual([{ path: `${cwd}/report.md`, kind: "truncate" }]);
        expect(paths("echo done >> report.md")).toEqual([]);
    });

    test("a stderr redirect is read too", () => {
        expect(paths("make 2> build.log")).toEqual([{ path: `${cwd}/build.log`, kind: "truncate" }]);
    });

    test("dd and tee write over the file they name", () => {
        expect(paths("dd if=/dev/zero of=disk.img bs=1M count=1")).toEqual([
            { path: `${cwd}/disk.img`, kind: "truncate" },
        ]);
        expect(paths("cat notes | tee out.txt")).toEqual([{ path: `${cwd}/out.txt`, kind: "truncate" }]);
        expect(paths("cat notes | tee -a out.txt")).toEqual([]);
    });

    test("mv names its source and where it would go", () => {
        expect(paths("mv a.txt /tmp/a.txt")).toEqual([
            { path: `${cwd}/a.txt`, kind: "move", destination: "/tmp/a.txt" },
        ]);
    });

    test("rsync --delete takes its destination", () => {
        expect(paths("rsync -a --delete src/ mirror/")).toEqual([
            { path: `${cwd}/mirror`, kind: "delete" },
        ]);
        expect(paths("rsync -a src/ mirror/")).toEqual([]);
    });

    test("git clean and git rm take the tree they run in", () => {
        expect(paths("git clean -fdx")).toEqual([{ path: cwd, kind: "delete" }]);
        expect(paths("git -C other rm a.txt")).toEqual([{ path: `${cwd}/other`, kind: "delete" }]);
        expect(paths("git status")).toEqual([]);
    });

    test("reading commands are left alone", () => {
        expect(paths("ls -la && cat report.md && grep -r foo .")).toEqual([]);
        expect(paths("find . -name '*.log'")).toEqual([]);
    });

    test("each command in a chain is read on its own", () => {
        expect(paths("cd build && rm -f a.txt; rm b.txt")).toEqual([
            { path: `${cwd}/a.txt`, kind: "delete" },
            { path: `${cwd}/b.txt`, kind: "delete" },
        ]);
    });

    test("a repeated path is named once", () => {
        expect(paths("rm -f a.txt && rm -f a.txt")).toEqual([{ path: `${cwd}/a.txt`, kind: "delete" }]);
    });

    test("a path with a glob is kept as written, so the folder is still matched", () => {
        expect(paths("rm hosts/proj/*.log")).toEqual([{ path: `${cwd}/hosts/proj/*.log`, kind: "delete" }]);
    });
});