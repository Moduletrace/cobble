import { z } from "zod";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import { AppData } from "@/src/data/app-data";
import insertBotMessage from "@/src/functions/backend/db/bots/insert-bot-message";
import type { HarnessTool } from "../../types";

type Params = {
    bot_id: number;
    /**
     * The session being answered: the message goes in it.
     */
    session_id: number;
    workspace_id?: number | null;
    /**
     * Called with each message sent, so the reply knows it said something.
     */
    onSend?: (params: { message_id: number }) => void;
    /**
     * Saves and pushes the message (`insertBotMessage`, `pushBotNotice`).
     */
    post?: (params: { text: string }) => Promise<{ id?: number | "" }>;
};

type Args = {
    text: string;
};

/**
 * Lets a reply post a message in the conversation now, without ending the
 * run: the bot acknowledges something the user wrote while it works ("Noted,
 * I'll do that once this is done") and carries on. The message is marked
 * `interim`, so the conversation keeps showing the bot at work, and is
 * pushed at once. At most `AppData.BotReplyInterimMessagesMax` per run.
 */
export default function sendMessageTool({
    bot_id,
    session_id,
    workspace_id,
    onSend,
    post = async ({ text }) => {
        const message = await insertBotMessage({ bot_id, session_id, workspace_id, text, interim: true });

        await pushBotNotice({ bot_id, message });

        return message;
    },
}: Params): HarnessTool<Args> {
    let sent = 0;

    return {
        name: "send_message",
        description: `Send the user a message now and keep working: your reply still comes when you finish. Use it to acknowledge something they wrote while you were working that is separate from what you're doing (say you'll get to it, then carry on), or for a short heads-up on long work. Not for your answer, and not for something that changes what you're doing: take that into account instead. At most ${AppData.BotReplyInterimMessagesMax} per reply.`,
        schema: z.object({
            text: z.string().trim().min(1).max(2000).describe(`The message (markdown), short`),
        }),
        run: async ({ args }) => {
            if (sent >= AppData.BotReplyInterimMessagesMax) {
                throw new Error(
                    `You've sent ${sent} messages in this reply already. Carry on, and put the rest in your answer.`,
                );
            }

            const message = await post({ text: args.text });

            sent++;
            onSend?.({ message_id: Number(message.id) });

            return `Sent. Carry on with what you were doing.`;
        },
    };
}
