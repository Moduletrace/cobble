import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import hostDirectoryLinkUids from "./host-directory-link-uids";

const bots = [
    { id: 1, kind: "coordinator" },
    { id: 4, kind: "worker" },
    { id: 6, kind: "worker" },
    { id: 8, kind: "worker" },
];

const worker = (bot_id: number) => AppData.ComputerWorkerIdBase + bot_id;

describe("hostDirectoryLinkUids", () => {
    test("a computer's folder covers every bot that reaches it, the coordinator first by uid", () => {
        expect(
            hostDirectoryLinkUids({
                bots,
                bot_computers: [{ bot_id: 4, computer_id: 1 }],
                workspace_bots: [{ bot_id: 6, workspace_id: 3 }],
                workspace_computers: [{ workspace_id: 3, computer_id: 1 }],
                scope: "computer",
                computer_id: 1,
            }),
        ).toEqual([AppData.ComputerUserUid, worker(4), worker(6)].sort((left, right) => left - right));
    });

    test("a bot on another computer is left out", () => {
        expect(
            hostDirectoryLinkUids({
                bots,
                bot_computers: [
                    { bot_id: 4, computer_id: 1 },
                    { bot_id: 8, computer_id: 2 },
                ],
                workspace_bots: [],
                workspace_computers: [],
                scope: "computer",
                computer_id: 1,
            }),
        ).toEqual([AppData.ComputerUserUid, worker(4)].sort((left, right) => left - right));
    });

    test("a workspace's folder covers its bots and the coordinator, not the bots outside it", () => {
        expect(
            hostDirectoryLinkUids({
                bots,
                bot_computers: [{ bot_id: 4, computer_id: 1 }],
                workspace_bots: [
                    { bot_id: 6, workspace_id: 3 },
                    { bot_id: 8, workspace_id: 4 },
                ],
                workspace_computers: [],
                scope: "workspace",
                workspace_id: 3,
            }),
        ).toEqual([AppData.ComputerUserUid, worker(6)].sort((left, right) => left - right));
    });

    test("a bot id with no row is left out rather than counted", () => {
        expect(
            hostDirectoryLinkUids({
                bots,
                bot_computers: [
                    { bot_id: 4, computer_id: 1 },
                    { bot_id: 99, computer_id: 1 },
                ],
                workspace_bots: [],
                workspace_computers: [],
                scope: "computer",
                computer_id: 1,
            }),
        ).toEqual([AppData.ComputerUserUid, worker(4)].sort((left, right) => left - right));
    });

    test("the same account twice is listed once", () => {
        expect(
            hostDirectoryLinkUids({
                bots,
                bot_computers: [
                    { bot_id: 4, computer_id: 1 },
                    { bot_id: 4, computer_id: 1 },
                ],
                workspace_bots: [],
                workspace_computers: [],
                scope: "computer",
                computer_id: 1,
            }),
        ).toEqual([AppData.ComputerUserUid, worker(4)].sort((left, right) => left - right));
    });
});