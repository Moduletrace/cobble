import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import { AppData } from "@/src/data/app-data";
import carryOverBotSession from "@/src/functions/backend/db/bot-sessions/carry-over-bot-session";
import type { HarnessTool } from "../../types";

type Params = {
    bot_id: number;
    user_id: number | string;
    /**
     * The session being answered: the one moved on from.
     */
    session_id: number;
    workspace_id?: number | null;
    /**
     * The reply's job, whose answer follows into the new session.
     */
    job_id?: number | null;
    /**
     * Called with the new session, so the rest of the run reads and
     * writes there.
     */
    onMove?: (params: { session_id: number }) => void;
    /**
     * Moves the conversation and pushes the summary
     * (`carryOverBotSession`, `pushBotNotice`), returning the summary's
     * message.
     */
    move?: (params: { summary: string; title?: string }) => Promise<Pick<BUN_SQLITE_COBBLE_BOT_MESSAGES, "session_id">>;
};

type Args = {
    summary: string;
    title?: string;
};

/**
 * Lets a reply move the conversation into a fresh session, so later replies
 * stop re-reading a long one: the bot writes what matters, which closes
 * this session and opens the next (`carryOverBotSession`). Once per run.
 */
export default function continueInNewSessionTool({
    bot_id,
    user_id,
    session_id,
    workspace_id,
    job_id,
    onMove,
    move = async ({ summary, title }) => {
        const message = await carryOverBotSession({ session_id, user_id, bot_id, workspace_id, summary, title, job_id });

        await pushBotNotice({ bot_id, message, quiet_push: true });

        return message;
    },
}: Params): HarnessTool<Args> {
    let moved = false;

    return {
        name: "continue_in_new_session",
        description: `Move this conversation into a fresh session, carrying over a summary you write. Every reply re-reads the session's recent messages, so a long one costs more each time. Always use it when the user asks to carry on in a new, fresh or different session ("let's continue this in another session", "start a new chat for this"): don't just agree, move. Also use it when the session has grown long and the current topic is at a natural break (say so in your answer). The summary opens the new session, shown to the user and given to you from then on in place of these messages, so put in everything needed to carry on: what the user wants, decisions made, what's done, what's in progress or open, and every name, number, path, link and ref ([bot:ID], [file:ID], ...) exactly. Call it last: your answer then goes in the new session under the summary, so keep it to a line.`,
        schema: z.object({
            summary: z
                .string()
                .trim()
                .min(1)
                .max(AppData.BotSessionSummaryMaxChars)
                .describe(`What the next session needs (markdown bullets, no preamble)`),
            title: z
                .string()
                .trim()
                .max(AppData.BotSessionTitleMaxChars)
                .optional()
                .describe(`A few words naming what the new session carries on with, shown in the session lists`),
        }),
        run: async ({ args }) => {
            if (moved) {
                throw new Error(`The conversation already moved to a new session in this reply.`);
            }

            const message = await move({ summary: args.summary, title: args.title });

            moved = true;
            onMove?.({ session_id: Number(message.session_id) });

            return `Moved: the new session opens with your summary. Finish with a one-line answer; it goes in the new session.`;
        },
    };
}
