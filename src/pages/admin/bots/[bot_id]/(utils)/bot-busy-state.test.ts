import { describe, expect, test } from "bun:test";
import {
    BotComputerBusyStatusLine,
    BotGettingMessageStatusLine,
    BotReplyJobTitle,
    BotWaitingStatusLine,
} from "@/src/dict/bot-queue-dict";
import type { BotWithLastMessage } from "@/src/types";
import botBusyState from "./bot-busy-state";

function bot(overrides: Partial<BotWithLastMessage>): BotWithLastMessage {
    return { id: 1, name: "Ember", ...overrides } as BotWithLastMessage;
}

describe("botBusyState", () => {
    test("a reply owed here is thinking", () => {
        const state = botBusyState({ bot: bot({ face: "idle" }), awaiting_reply: true });

        expect(state.thinking).toBe(true);
        expect(state.busy).toBe(true);
    });

    test("a message still on its way is getting, not thinking", () => {
        const state = botBusyState({
            bot: bot({ face: "working" }),
            awaiting_reply: true,
            receiving: true,
        });

        expect(state.getting).toBe(true);
        expect(state.thinking).toBe(false);
    });

    test("a task running while the bot has the last word is working", () => {
        const state = botBusyState({
            bot: bot({ face: "working", status_line: "Working" }),
            awaiting_reply: false,
            has_task: true,
        });

        expect(state.working).toBe(true);
        expect(state.busy).toBe(true);
    });

    test("a reply's own turn never shows as working on a task", () => {
        const state = botBusyState({
            bot: bot({ face: "working", status_line: BotReplyJobTitle }),
            has_task: true,
        });

        expect(state.working).toBe(false);
        expect(state.busy).toBe(false);
    });

    test("waiting for a model is a wait, with a reply owed here", () => {
        const state = botBusyState({
            bot: bot({ face: "asleep", status_line: BotWaitingStatusLine }),
            awaiting_reply: true,
        });

        expect(state.waiting).toBe(true);
        expect(state.thinking).toBe(false);
        expect(state.busy).toBe(true);
    });

    test("waiting for a model is a wait, with a task running", () => {
        const state = botBusyState({
            bot: bot({ face: "asleep", status_line: BotWaitingStatusLine }),
            has_task: true,
        });

        expect(state.waiting).toBe(true);
        expect(state.busy).toBe(true);
    });

    test("waiting for its computer is a wait only while a task runs", () => {
        const waiting = botBusyState({
            bot: bot({ face: "asleep", status_line: BotComputerBusyStatusLine }),
            has_task: true,
        });
        const idle = botBusyState({
            bot: bot({ face: "asleep", status_line: BotComputerBusyStatusLine }),
        });

        expect(waiting.waiting).toBe(true);
        expect(idle.busy).toBe(false);
    });

    test("a message still on its way wins over the wait, so the row says what the user just did", () => {
        const state = botBusyState({
            bot: bot({ face: "asleep", status_line: BotWaitingStatusLine }),
            awaiting_reply: true,
            receiving: true,
        });

        expect(state.getting).toBe(true);
        expect(state.waiting).toBe(true);
    });

    test("an idle bot with nothing owed and no task shows nothing", () => {
        const state = botBusyState({ bot: bot({ face: "idle" }) });

        expect(state.busy).toBe(false);
    });

    test("a done face with no task shows nothing", () => {
        expect(botBusyState({ bot: bot({ face: "done" }) }).busy).toBe(false);
    });
});

describe("botBusyState stoppable", () => {
    test("busy in this thread is stoppable", () => {
        expect(
            botBusyState({
                bot: bot({ face: "idle" }),
                awaiting_reply: true,
            }).stoppable,
        ).toBe(true);
    });

    test("working somewhere else is stoppable too, since the face is per user", () => {
        const state = botBusyState({ bot: bot({ face: "working" }) });

        expect(state.busy).toBe(false);
        expect(state.stoppable).toBe(true);
    });

    test("asleep on a wait line is stoppable, even when this thread shows nothing", () => {
        for (const status_line of [BotWaitingStatusLine, BotComputerBusyStatusLine]) {
            expect(botBusyState({ bot: bot({ face: "asleep", status_line }) }).stoppable).toBe(true);
        }
    });

    test("a bot simply resting is not stoppable", () => {
        const state = botBusyState({
            bot: bot({ face: "asleep", status_line: "Until tomorrow" }),
        });

        expect(state.busy).toBe(false);
        expect(state.stoppable).toBe(false);
    });

    test("a message only being collected is not stoppable: its reply is queued after it", () => {
        const state = botBusyState({
            bot: bot({ face: "idle" }),
            awaiting_reply: true,
            receiving: true,
        });

        expect(state.getting).toBe(true);
        expect(state.stoppable).toBe(false);
    });

    test("done, needs-you and idle mean nothing is running", () => {
        for (const face of ["done", "needs-you", "idle"] as const) {
            const state = botBusyState({ bot: bot({ face }) });

            expect(state.stoppable).toBe(false);
        }
    });

    test("a silently stopped bot is not stoppable", () => {
        const state = botBusyState({
            bot: bot({ face: "idle" }),
            awaiting_reply: false,
            has_task: false,
        });

        expect(state.stoppable).toBe(false);
    });

    test("a reply job's own turn with no task owed is not stoppable", () => {
        /**
         * The face says working while a reply runs somewhere else, which is
         * real work: it's stoppable even though this thread owes nothing.
         */
        const state = botBusyState({
            bot: bot({ face: "working", status_line: BotReplyJobTitle }),
        });

        expect(state.stoppable).toBe(true);
    });

    test("the getting line still labels the row", () => {
        const state = botBusyState({
            bot: bot({ face: "idle", status_line: BotGettingMessageStatusLine }),
            awaiting_reply: true,
            receiving: true,
        });

        expect(state.getting).toBe(true);
    });
});
