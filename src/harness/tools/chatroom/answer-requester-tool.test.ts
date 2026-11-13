import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";

/**
 * Jobs still running in the room. Closing cancels them, so the tool has to
 * refuse over one: a coordinator once answered while the Software Engineer
 * ran the work it had been asked for, the run died with "The chatroom
 * closed", and the answer said the tasks were picked up.
 */
let open: { id: number; bot_id: number | null; bot_name: string | null; status: string }[] = [];
let closedArgs: Record<string, unknown> | null = null;
let closed = true;

mock.module("@/src/functions/backend/db/chatrooms/grab-chatroom-open-jobs", () => ({
    default: async () => open,
}));
mock.module("@/src/functions/backend/db/chatrooms/share-room-files", () => ({
    default: async ({ answer }: { answer: string }) => answer,
}));
mock.module("@/src/functions/backend/db/chatrooms/close-chatroom", () => ({
    default: async (args: Record<string, unknown>) => {
        closedArgs = args;

        return closed;
    },
}));

const answerRequesterTool = (await import("./answer-requester-tool")).default;

afterAll(() => {
    mock.restore();
});

const room = { id: 3, status: "open", requester_bot_id: 2 } as BUN_SQLITE_COBBLE_CHATROOMS;

beforeEach(() => {
    open = [];
    closedArgs = null;
    closed = true;
});

function build(onClosed?: () => void) {
    return answerRequesterTool({ chatroom: room, job_id: 300, onClosed });
}

describe("answerRequesterTool", () => {
    test("answers and closes the room when nothing else runs", async () => {
        const acted: string[] = [];
        const answer = await build(() => acted.push("closed")).run({ args: { answer: "The plan." }, signal: new AbortController().signal });

        expect(String(answer)).toContain("The room is closed");
        expect(closedArgs?.status).toBe("answered");
        expect(closedArgs?.outcome).toBe("The plan.");
        expect(closedArgs?.job_id).toBe(300);
        expect(acted).toEqual(["closed"]);
    });

    test("refuses while a member job still runs, naming it", async () => {
        open = [{ id: 295, bot_id: 6, bot_name: "Software Engineer", status: "processing" }];

        await expect(build().run({ args: { answer: "Done." }, signal: new AbortController().signal })).rejects.toThrow(
            "Still working here: Software Engineer (run #295, processing). Answering closes the room and cancels that run",
        );

        expect(closedArgs).toBeNull();
    });

    test("close_anyway answers over it", async () => {
        open = [{ id: 295, bot_id: 6, bot_name: "Software Engineer", status: "processing" }];

        await build().run({ args: { answer: "Not needed after all.", close_anyway: true }, signal: new AbortController().signal });

        expect(closedArgs?.status).toBe("answered");
    });

    test("a room already closed is reported, not acted on", async () => {
        closed = false;

        const acted: string[] = [];

        await expect(build(() => acted.push("closed")).run({ args: { answer: "Late." }, signal: new AbortController().signal })).rejects.toThrow(
            "This room is already closed.",
        );

        expect(acted).toEqual([]);
    });
});