import { describe, expect, test } from "bun:test";
import runUserFor from "./run-user-for";

describe("runUserFor", () => {
    test("names a worker's account from its bot id", () => {
        expect(runUserFor({ bot_id: 7 })).toEqual({
            name: "cb-7",
            uid: 100_007,
            gid: 100_007,
            home: "/home/cb-7",
            bot_dir: "/home/gem/workspace/bots/7",
            workspace: null,
        });
    });

    test("adds the workspace's group", () => {
        expect(runUserFor({ bot_id: "3", workspace_id: "12" }).workspace).toEqual({
            name: "cw-12",
            gid: 10_000_012,
            dir: "/home/gem/workspace/workspaces/12",
        });
    });

    test("no workspace for 0, null or an empty id", () => {
        for (const workspace_id of [0, null, undefined, ""]) expect(runUserFor({ bot_id: 1, workspace_id }).workspace).toBeNull();
    });

    test("refuses ids that aren't whole numbers in range", () => {
        for (const bot_id of [0, -1, 1.5, "1; rm -rf /", "../2", 9_000_001, null, undefined, "", "0x10"]) {
            expect(() => runUserFor({ bot_id })).toThrow();
        }

        expect(() => runUserFor({ bot_id: 1, workspace_id: "x" })).toThrow();
        expect(() => runUserFor({ bot_id: 1, workspace_id: 9_000_001 })).toThrow();
    });
});
