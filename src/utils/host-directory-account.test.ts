import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import hostDirectoryAccount from "./host-directory-account";

describe("hostDirectoryAccount", () => {
    test("the coordinator works as the computer's own user", () => {
        expect(hostDirectoryAccount({ bot_id: 1, bot_kind: "coordinator" })).toEqual({
            uid: AppData.ComputerUserUid,
            gid: AppData.ComputerUserGid,
            group_ids: [],
        });
    });

    test("the coordinator is in no workspace's group", () => {
        expect(hostDirectoryAccount({ bot_id: 1, bot_kind: "coordinator", workspace_ids: [3] })).toEqual({
            uid: AppData.ComputerUserUid,
            gid: AppData.ComputerUserGid,
            group_ids: [],
        });
    });

    test("a worker works as its own account", () => {
        expect(hostDirectoryAccount({ bot_id: 7, bot_kind: "worker" })).toEqual({
            uid: AppData.ComputerWorkerIdBase + 7,
            gid: AppData.ComputerWorkerIdBase + 7,
            group_ids: [],
        });
    });

    test("in a workspace it is in the workspace's group too", () => {
        expect(hostDirectoryAccount({ bot_id: "7", bot_kind: "worker", workspace_ids: ["3"] })).toEqual({
            uid: AppData.ComputerWorkerIdBase + 7,
            gid: AppData.ComputerWorkerIdBase + 7,
            group_ids: [AppData.ComputerWorkspaceGroupIdBase + 3],
        });
    });
});