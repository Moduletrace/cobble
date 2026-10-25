import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import sendMessageTool from "./send-message-tool";

const signal = new AbortController().signal;

function tool() {
    const posted: string[] = [];
    const sent: number[] = [];
    const send = sendMessageTool({
        bot_id: 2,
        session_id: 100,
        post: async ({ text }) => {
            posted.push(text);
            return { id: posted.length };
        },
        onSend: ({ message_id }) => sent.push(message_id),
    });

    return { send, posted, sent };
}

describe("sendMessageTool", () => {
    test("posts the message now and tells the bot to carry on", async () => {
        const { send, posted, sent } = tool();

        const result = await send.run({ args: { text: "Noted, I'll do that once this is done." }, signal });

        expect(posted).toEqual(["Noted, I'll do that once this is done."]);
        expect(sent).toEqual([1]);
        expect(result).toContain("Carry on");
    });

    test("stops at the cap, so a reply can't flood the chat", async () => {
        const { send, posted } = tool();

        for (let i = 0; i < AppData.BotReplyInterimMessagesMax; i++) {
            await send.run({ args: { text: `Heads-up ${i}` }, signal });
        }

        const error = await Promise.resolve(send.run({ args: { text: "One more" }, signal })).catch(
            (e) => e,
        );

        expect(error).toBeInstanceOf(Error);
        expect(posted).toHaveLength(AppData.BotReplyInterimMessagesMax);
    });

    test("refuses an empty message", () => {
        expect(tool().send.schema?.safeParse({ text: "   " }).success).toBe(false);
    });
});
