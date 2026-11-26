import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import grabAsk from "@/src/functions/backend/db/asks/grab-ask";
import askUpdateMessage from "@/src/functions/backend/db/asks/ask-update-message";
import shareAskFiles from "@/src/functions/backend/db/asks/share-ask-files";
import tellAskRequester from "@/src/functions/backend/db/asks/tell-ask-requester";
import stripQuestionRefs from "@/src/utils/strip-question-refs";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The bot answering: only the bot the request was passed to may send
     * its answer back.
     */
    bot_id: number | string;
    /**
     * The ended request this conversation answered, found by the caller
     * through `grabEndedAskBySession`.
     */
    ask_id: number | string;
    /**
     * What the run typed, run through the run's secret redaction before it
     * is stored: the answer lands in another bot's conversation, where a
     * raw env value would sit in a message forever.
     */
    redact?: (text: string) => string;
};

type Args = {
    text: string;
};

/**
 * The gap `ask_bot` kept falling into: the request ended (often `blocked`,
 * or stopped), the user carries on in the answer session and gets the work
 * done, and the bot's only way back to the asking bot was a brand-new
 * request - which the gate reads as a fresh handoff and can refuse, leaving
 * the asker never told. This tool posts the finished answer straight back to
 * the conversation the request came from, on the ended request's own record
 * (`from_ask_id`, with its files shared), and wakes the asking bot. It ends
 * nothing and reopens nothing: the request's row keeps the status it ended
 * with, and the message says plainly it arrived after the end.
 */
export default function answerRequesterTool({ user_id, bot_id, ask_id, redact = (text) => text }: Params): HarnessTool<Args> {
    return {
        name: "answer_requester",
        description: `Send the bot that asked you a late or corrected answer to the request this conversation answered - after that request had already ended (blocked, stopped or answered). It lands in the conversation the request came from, shares any files it names, and wakes that bot. Use this instead of ask_bot for finishing what that request asked: a new request goes through the coordinator again and reads as a different handoff. Your ordinary answer here is the message; this tool is only for getting it back to the bot that asked.`,
        schema: z.object({
            text: z
                .string()
                .trim()
                .min(1)
                .max(AppData.AskBriefMaxChars)
                .describe(`The answer (markdown): what you finished, with [file:ID] refs for what you produced`),
        }),
        run: async ({ args }) => {
            const ask = await grabAsk({ ask_id, user_id });

            if (!ask?.id) {
                throw new Error(`That request isn't here anymore.`);
            }

            if (ask.status == "pending" || ask.status == "working") {
                throw new Error(
                    `This request is still open: your answer goes back on its own when your work ends, and update_requester sends a word meanwhile.`,
                );
            }

            if (Number(ask.target_bot_id) != Number(bot_id)) {
                throw new Error(`This conversation didn't answer that request, so it has no answer to send back.`);
            }

            const shared = stripQuestionRefs({
                text: await shareAskFiles({ ask, answer: redact(args.text) }),
            }).text;

            await tellAskRequester({ ask, text: askUpdateMessage({ ask, text: shared, ended: true }) });

            return `Sent to the bot that asked, on "${ask.title}" [ask:${ask.id}]. Its conversation wakes for it.`;
        },
    };
}
