import { describe, expect, test } from "bun:test";
import computerWorkspacePath from "./computer-workspace-path";

const W = "/home/gem/workspace";

describe("computerWorkspacePath", () => {
    test("a worker's kept folder is the bot's folder in the workspace", () => {
        expect(computerWorkspacePath({ absolute: "/home/cb-3/workspace" })).toBe(`${W}/bots/3`);
        expect(computerWorkspacePath({ absolute: "/home/cb-3/workspace/users/7/a/" })).toBe(`${W}/bots/3/users/7/a`);
    });

    test("a workspace folder inside it is the shared one", () => {
        expect(computerWorkspacePath({ absolute: "/home/cb-3/workspace/workspaces/2/x" })).toBe(`${W}/workspaces/2/x`);
        expect(computerWorkspacePath({ absolute: `${W}/bots/3/workspaces/2` })).toBe(`${W}/workspaces/2`);
        expect(computerWorkspacePath({ absolute: "/home/cb-3/workspace/workspaces" })).toBe(`${W}/bots/3/workspaces`);
    });

    test("the rest of a worker's home and other paths stay as they are", () => {
        expect(computerWorkspacePath({ absolute: "/home/cb-3/.cobble/env" })).toBe("/home/cb-3/.cobble/env");
        expect(computerWorkspacePath({ absolute: "/home/cb-3/workspace2" })).toBe("/home/cb-3/workspace2");
        expect(computerWorkspacePath({ absolute: `${W}/bots/3/users/7` })).toBe(`${W}/bots/3/users/7`);
        expect(computerWorkspacePath({ absolute: "/home/cb-3/workspace/../../gem/x" })).toBe("/home/gem/x");
    });
});
