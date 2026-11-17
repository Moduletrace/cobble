import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import rerunReplyProblem from "./rerun-reply-problem";

type Reply = Pick<
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    "id" | "author" | "from_ask_id" | "from_install_request_id"
>;

const reply: Reply = { id: 12, author: "bot" };
const user_message: Reply = { id: 13, author: "user" };

const can_rerun = {
    message: reply,
    last_bot_id: 12,
    last_message_id: 12,
    session_status: "active",
    latest_user_id: 10,
};

describe("rerunReplyProblem", () => {
    test("the bot's last reply in an active session can be run again", () => {
        expect(rerunReplyProblem({ ...can_rerun })).toBeNull();
        expect(rerunReplyProblem({ ...can_rerun, last_bot_id: "12" })).toBeNull();
    });

    test("a user message nothing answered is asked again", () => {
        expect(
            rerunReplyProblem({
                ...can_rerun,
                message: user_message,
                last_message_id: 13,
            }),
        ).toBeNull();
        expect(
            rerunReplyProblem({
                ...can_rerun,
                message: user_message,
                last_message_id: 14,
            }),
        ).toBe(`Only the last message can be answered again.`);
        expect(
            rerunReplyProblem({
                ...can_rerun,
                message: user_message,
                last_message_id: null,
            }),
        ).toBe(`Only the last message can be answered again.`);
    });

    test("only the bot's own last reply is a target", () => {
        expect(rerunReplyProblem({ ...can_rerun, message: null })).toBe(
            `Only a message in this conversation can be run again.`,
        );
        expect(
            rerunReplyProblem({
                ...can_rerun,
                message: { ...reply, from_ask_id: 4 },
            }),
        ).toBe(`Only the bot's own reply can be run again.`);
        expect(
            rerunReplyProblem({
                ...can_rerun,
                message: { ...reply, from_install_request_id: 4 },
            }),
        ).toBe(`Only the bot's own reply can be run again.`);
    });

    test("an older reply is not run again with newer words after it", () => {
        expect(rerunReplyProblem({ ...can_rerun, last_bot_id: 14 })).toBe(
            `Only the last reply can be run again.`,
        );
        expect(rerunReplyProblem({ ...can_rerun, last_bot_id: null })).toBe(
            `Only the last reply can be run again.`,
        );
    });

    test("a conversation that moved on can't be run again into", () => {
        expect(rerunReplyProblem({ ...can_rerun, session_status: "closed" })).toBe(
            `This conversation has moved on.`,
        );
        expect(rerunReplyProblem({ ...can_rerun, session_status: null })).toBe(
            `This conversation has moved on.`,
        );
        expect(
            rerunReplyProblem({
                ...can_rerun,
                message: user_message,
                last_message_id: 13,
                session_status: "closed",
            }),
        ).toBe(`This conversation has moved on.`);
    });

    test("a reply already on its way is not run beside", () => {
        expect(rerunReplyProblem({ ...can_rerun, open_reply_id: 15 })).toBe(
            `A reply is already on its way.`,
        );
        expect(
            rerunReplyProblem({
                ...can_rerun,
                message: user_message,
                last_message_id: 13,
                open_reply_id: 15,
            }),
        ).toBe(`A reply is already on its way.`);
    });

    test("a session with no user message has nothing to answer", () => {
        expect(rerunReplyProblem({ ...can_rerun, latest_user_id: null })).toBe(
            `There is nothing to reply to.`,
        );
    });
});