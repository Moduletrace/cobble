import { describe, expect, test } from "bun:test";
import grabStorageScopes from "./storage-access";

describe("grabStorageScopes", () => {
    test("a worker in its own chat reaches only its folder", () => {
        expect(grabStorageScopes({ bot_id: 4, bot_kind: "worker" })).toEqual([
            { scope: "bot", owner_id: 4 },
        ]);
    });

    test("a worker in a workspace also reaches the workspace's folder", () => {
        expect(
            grabStorageScopes({ bot_id: 4, bot_kind: "worker", workspace_id: 9 }),
        ).toEqual([
            { scope: "bot", owner_id: 4 },
            { scope: "workspace", owner_id: 9 },
        ]);
    });

    test("the coordinator reaches every workspace, its own folder first", () => {
        expect(
            grabStorageScopes({
                bot_id: 1,
                bot_kind: "coordinator",
                all_workspace_ids: [9, 3],
            }),
        ).toEqual([
            { scope: "bot", owner_id: 1 },
            { scope: "workspace", owner_id: 9 },
            { scope: "workspace", owner_id: 3 },
        ]);
    });

    test("the coordinator in a workspace still reaches them all", () => {
        const scopes = grabStorageScopes({
            bot_id: 1,
            bot_kind: "coordinator",
            workspace_id: 9,
            all_workspace_ids: [9],
        });

        expect(scopes).toEqual([
            { scope: "bot", owner_id: 1 },
            { scope: "workspace", owner_id: 9 },
        ]);
    });

    test("ignores invalid workspace ids", () => {
        expect(
            grabStorageScopes({
                bot_id: 1,
                bot_kind: "coordinator",
                all_workspace_ids: [0, 2],
            }),
        ).toEqual([
            { scope: "bot", owner_id: 1 },
            { scope: "workspace", owner_id: 2 },
        ]);
    });
});
