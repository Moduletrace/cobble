import { describe, expect, test } from "bun:test";
import type { ChatroomBot } from "@/src/types";
import chatroomBotStatuses from "./chatroom-bot-statuses";

const asker: ChatroomBot = { id: 7, name: "Asker", kind: "worker" };
const coordinator: ChatroomBot = { id: 1, name: "Coordinator", kind: "coordinator" };
const helper: ChatroomBot = { id: 9, name: "Helper", kind: "worker" };
const bots = [asker, coordinator, helper];

describe("chatroomBotStatuses", () => {
    test("a closed room has no rows", () => {
        expect(chatroomBotStatuses({ room: { status: "answered", requester_bot_id: 7, bots, jobs: [] } })).toEqual([]);
    });

    test("while the asked bot works, the coordinator waits on it and the asker waits for the answer", () => {
        const rows = chatroomBotStatuses({
            room: {
                status: "open",
                requester_bot_id: 7,
                bots,
                jobs: [{ bot_id: 9, session_id: 30, status: "processing", progress: "Reading a file" }],
            },
            steps: { 30: "Searching the web" },
        });

        expect(rows.map((row) => row.label)).toEqual([
            "Asker is waiting for the answer",
            "Coordinator is waiting on Helper",
            "Helper is working…",
        ]);
        expect(rows[2]!.detail).toBe("Searching the web");
        expect(rows.map((row) => row.active)).toEqual([false, false, true]);
    });

    test("a queued coordinator turn is getting to it, then thinking once a step comes in", () => {
        const room = {
            status: "open" as const,
            requester_bot_id: 7,
            bots: [asker, coordinator],
            jobs: [{ bot_id: 1, session_id: 20, status: "pending" }],
        };

        expect(chatroomBotStatuses({ room })[1]!.label).toBe("Coordinator is getting to it…");
        expect(chatroomBotStatuses({ room, steps: { 20: "Asking Helper" } })[1]).toMatchObject({
            label: "Coordinator is thinking…",
            detail: "Asking Helper",
        });
    });

    test("an asked bot without an open job is done", () => {
        const rows = chatroomBotStatuses({
            room: { status: "open", requester_bot_id: 7, bots, jobs: [{ bot_id: 1, session_id: 20, status: "processing" }] },
        });

        expect(rows[2]!.label).toBe("Helper is done");
    });
});
