import type { BUN_SQLITE_COBBLE_BOT_QUESTIONS, BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import { logError } from "@/src/functions/backend/logger";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import wakeBotsQueue from "@/src/bots-queue/wake-bots-queue";
import type { BotQuestionView } from "@/src/types";
import botQuestionAnswersText from "@/src/utils/bot-question-answers-text";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import grabUserBotSession from "../bot-sessions/grab-user-bot-session";
import insertUserMessage from "../bots/insert-user-message";
import enqueueBotReply from "../bots-queue/enqueue-bot-reply";
import grabBotQuestion from "./grab-bot-question";

type Params = {
    view: BotQuestionView;
    user_id: number | string;
};

/**
 * Tells the bot, in the conversation its questions were asked in, what the
 * user answered (or that they skipped them): the user's chat message there,
 * which wakes it. The route posts this, not the card's page: the same
 * conversation can be on screen in several places, and an answer belongs
 * where the question was asked, never to whichever bot's page was open.
 * Best effort: a failure is logged and never undoes the answer.
 */
export default async function postBotQuestionAnswers({ view, user_id }: Params) {
    try {
        const row = await grabBotQuestion({ question_id: view.id, user_id });

        if (!row.bot_id) return;

        const session = await pickSession({ row, user_id });

        const message = await insertUserMessage({
            bot_id: Number(row.bot_id),
            session_id: Number(session.id),
            workspace_id: session.workspace_id || null,
            text: botQuestionAnswersText({ view }),
        });

        await pushBotNotice({ bot_id: row.bot_id, message });

        await enqueueBotReply({
            user_id,
            bot_id: row.bot_id,
            session_id: Number(session.id),
            message_id: Number(message.id),
        });

        wakeBotsQueue();
    } catch (error: unknown) {
        await logError({
            title: `A bot's question answers didn't reach it`,
            error,
            metadata: { question_id: view.id },
        }).catch(() => {});
    }
}

/**
 * The session the questions were asked in while it's still where the bot
 * talks; otherwise its conversation's active one, so the answer isn't left
 * in a closed thread.
 */
async function pickSession({
    row,
    user_id,
}: {
    row: Pick<BUN_SQLITE_COBBLE_BOT_QUESTIONS, "bot_id" | "session_id" | "workspace_id">;
    user_id: number | string;
}): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const origin = row.session_id
        ? await grabUserBotSession({ session_id: row.session_id, user_id })
        : null;

    /**
     * A hidden session (a crew request's, a hook's) is only read there.
     */
    if (origin?.id && origin.status == "active" && !origin.ask_id && !origin.hook_id) {
        return origin;
    }

    return await ensureBotSession({
        user_id,
        bot_id: row.bot_id!,
        workspace_id: row.workspace_id || null,
    });
}