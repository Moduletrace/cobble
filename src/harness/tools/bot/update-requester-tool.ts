import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import grabAsk from "@/src/functions/backend/db/asks/grab-ask";
import grabOpenAskBySession from "@/src/functions/backend/db/asks/grab-open-ask-by-session";
import askUpdateMessage from "@/src/functions/backend/db/asks/ask-update-message";
import tellAskRequester from "@/src/functions/backend/db/asks/tell-ask-requester";
import stripQuestionRefs from "@/src/utils/strip-question-refs";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The session the run works in: the request's answer session, unless the
     * run was handed the work in another bot's conversation (`ask_id` then).
     */
    session_id: number | string;
    /**
     * The request this run is part of, when the job carries it.
     */
    ask_id?: number | string;
    /**
     * Called with each update sent, so the run knows it said something.
     */
    onSend?: (params: { message_id: number }) => void;
};

type Args = {
    text: string;
};

/**
 * Lets a bot answering a crew request send the bot that asked an update now,
 * without ending the run or the request: a heads-up on long work, or a piece
 * of the answer that is ready while the rest is still being worked. It lands
 * in the conversation the request came from and wakes that bot, marked as an
 * update on a request that is still open. Not the final answer - that comes
 * back on its own when the work ends. At most
 * `AppData.BotReplyInterimMessagesMax` per run.
 */
export default function updateRequesterTool({ user_id, session_id, ask_id, onSend }: Params): HarnessTool<Args> {
    let sent = 0;

    return {
        name: "update_requester",
        description: `Send the bot that asked you an update now and keep working: it lands in the conversation the request came from and wakes that bot. Use it for a short heads-up on long work, or a piece of the answer that's ready while the rest is still being worked. Not your final answer - that goes back on its own when the work ends - and not a question for the user. At most ${AppData.BotReplyInterimMessagesMax} per run.`,
        schema: z.object({
            text: z.string().trim().min(1).max(2000).describe(`The update (markdown), short`),
        }),
        run: async ({ args }) => {
            if (sent >= AppData.BotReplyInterimMessagesMax) {
                throw new Error(
                    `You've sent ${sent} updates on this request already. Carry on, and let the rest come back with the result.`,
                );
            }

            const ask = ask_id
                ? await grabAsk({ ask_id, user_id })
                : await grabOpenAskBySession({ session_id, user_id });

            if (!ask?.id || (ask.status != "pending" && ask.status != "working")) {
                throw new Error(`This request has already ended. Put the rest in your answer.`);
            }

            const posted = await tellAskRequester({
                ask,
                text: askUpdateMessage({ ask, text: stripQuestionRefs({ text: args.text }).text }),
            });

            sent++;
            onSend?.({ message_id: Number(posted?.message.id) });

            return `Sent to the bot that asked. Carry on with what you were doing.`;
        },
    };
}
