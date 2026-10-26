import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { SessionContinuePrompt } from "@/src/data/harness-prompts";
import parseSessionName from "@/src/bots-queue/parse-session-name";
import sessionNameTranscript from "@/src/bots-queue/session-name-transcript";
import generateText from "@/src/harness/text/generate-text";
import { runWithHarnessUsageScope } from "@/src/harness/usage/harness-usage-scope";
import AppError from "@/src/utils/app-error";
import grabBotMessages from "../bots/grab-bot-messages";
import carryOverBotSession from "./carry-over-bot-session";
import grabActiveBotSession from "./grab-active-bot-session";
import hasOpenSessionJob from "./has-open-session-job";

type Params = {
    user_id: number | string;
    bot_id: number;
    workspace_id?: number | null;
};

/**
 * Continue in new session, asked by the user from the conversation's
 * menu (and the automatic rollover, `rollOverBotSession`): does what the
 * bot does with `continue_in_new_session`. The bot's
 * text model writes the new session's title and the summary from the
 * session's latest messages, then `carryOverBotSession` closes this
 * session for good and opens the new one with the summary. Refused while
 * the bot is still working in the session, since its answer would land in
 * the closed one. Returns the summary's message, for the caller to push.
 */
export default async function continueBotSession({
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES> {
    const active = await grabActiveBotSession({ user_id, bot_id, workspace_id });

    if (!active?.id) throw new AppError(`This conversation has no session to continue from yet.`);

    if (await hasOpenSessionJob({ session_id: active.id })) {
        throw new AppError(`The bot is still working in this session. Wait for it to finish, or stop it, then continue.`);
    }

    const messages = await grabBotMessages({
        session_id: active.id,
        limit: AppData.BotSessionSummaryMessages,
    });

    if (!messages.length) throw new AppError(`This session has no messages yet: it's already fresh.`);

    const result = await runWithHarnessUsageScope({
        scope: {
            user_id,
            bot_id,
            workspace_id: workspace_id || null,
            session_id: active.id,
            job_id: null,
            message_id: null,
        },
        task: () =>
            generateText({
                messages: [
                    { role: "system", content: SessionContinuePrompt },
                    { role: "user", content: sessionNameTranscript({ messages }) },
                ],
                bot_id,
                workspace_id,
            }),
    });

    const written = parseSessionName({ text: result.text });

    if (!written?.summary) {
        throw new AppError(`Couldn't write the summary to carry over. Try again.`);
    }

    return await carryOverBotSession({
        session_id: active.id,
        user_id,
        bot_id,
        workspace_id,
        summary: written.summary,
        title: written.title,
    });
}
