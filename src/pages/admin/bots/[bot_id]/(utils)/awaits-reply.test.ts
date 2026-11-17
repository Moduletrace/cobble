import { describe, expect, test } from "bun:test";
import type { BotMessageWithAttachments } from "@/src/types";
import awaitsReply from "./awaits-reply";

const user_message = { id: 657, author: "user" } as BotMessageWithAttachments;
const bot_message = { id: 656, author: "bot" } as BotMessageWithAttachments;

describe("awaitsReply", () => {
    test("waits on the user's last word while the session's replies are unread", () => {
        expect(
            awaitsReply({
                last_message: user_message,
                face: "idle",
                open_reply_jobs: null,
            }),
        ).toBe(true);
    });

    test("a run that ended without a word leaves nothing to wait on", () => {
        expect(
            awaitsReply({
                last_message: user_message,
                face: "idle",
                open_reply_jobs: 0,
            }),
        ).toBe(false);
    });

    test("waits while a reply is still to come", () => {
        expect(
            awaitsReply({
                last_message: user_message,
                face: "working",
                open_reply_jobs: 1,
            }),
        ).toBe(true);
    });

    test("a bot that has the last word is not waiting on itself", () => {
        expect(
            awaitsReply({
                last_message: bot_message,
                face: "idle",
                open_reply_jobs: null,
            }),
        ).toBe(false);
    });

    test("a reply asked for again waits even before its job is claimed", () => {
        expect(
            awaitsReply({
                rerun_message_id: 656,
                last_message: bot_message,
                face: "idle",
                open_reply_jobs: 0,
            }),
        ).toBe(true);
    });

    test("a conversation that moved on waits on nothing", () => {
        expect(
            awaitsReply({
                moved_on: true,
                rerun_message_id: 656,
                last_message: user_message,
                face: "working",
                open_reply_jobs: 1,
            }),
        ).toBe(false);
    });
});