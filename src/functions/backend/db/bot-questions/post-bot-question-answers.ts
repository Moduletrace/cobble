import type { BUN_SQLITE_COBBLE_BOT_QUESTIONS, BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import { logError } from "@/src/functions/backend/logger";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import pushBotPlan from "@/src/bots-queue/push-bot-plan";
import wakeBotsQueue from "@/src/bots-queue/wake-bots-queue";
import type { BotQuestionView } from "@/src/types";
import botQuestionAnswersText from "@/src/utils/bot-question-answers-text";
import planContinueAnswer from "@/src/utils/plan-continue-answer";
import conversationLock from "../bot-sessions/conversation-lock";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import grabUserBotSession from "../bot-sessions/grab-user-bot-session";
import insertUserMessage from "../bots/insert-user-message";
import enqueueBotReply from "../bots-queue/enqueue-bot-reply";
import setBotPlanStatus from "../bot-plans/set-bot-plan-status";
import enqueuePlanStep from "../bot-plans/enqueue-plan-step";
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
 *
 * A card a plan's step ended on is the plan's own next move: Continue
 * starts its next step, and anything else pauses it, so the plan never
 * waits on the user to say "move on" in the chat.
 *
 * Best effort: a failure is logged and never undoes the answer.
 */
export default async function postBotQuestionAnswers({ view, user_id }: Params) {
    try {
        const row = await grabBotQuestion({ question_id: view.id, user_id });

        if (!row.bot_id) return;

        const workspace_id = row.workspace_id || null;
        const bot_id = Number(row.bot_id);

        await conversationLock.run({
            key: `${user_id}:${bot_id}:${workspace_id || 0}`,
            task: async () => {
                const session = await pickSession({ row, user_id });

                /**
                 * Asked in Plan mode, answered and skipped in it: a question
                 * is about what to plan, so its answer must not unlock the
                 * write tools (the only ways out are Tab and approving a
                 * plan).
                 */
                const plan_mode = Boolean(row.plan_mode);

                const message = await insertUserMessage({
                    bot_id,
                    session_id: Number(session.id),
                    workspace_id,
                    text: botQuestionAnswersText({ view }),
                    plan_mode,
                });

                await pushBotNotice({ bot_id, message });

                const plan_id = Number(row.plan_id) || 0;
                const continue_plan = plan_id > 0 && planContinueAnswer({ view });

                if (plan_id > 0 && !continue_plan) {
                    await setBotPlanStatus({ plan_id, user_id, status: "paused" })
                        .then(async () => {
                            await pushBotPlan({
                                plan_id,
                                session_id: Number(session.id),
                                bot_id,
                            });
                        })
                        .catch(() => null);
                }

                if (continue_plan) {
                    const step_job = await enqueuePlanStep({ plan_id }).catch(() => null);

                    /**
                     * The plan runs its step as its own run, which reads the
                     * answer above in the conversation. Only when that can't
                     * be queued does the answer get an ordinary reply, so it
                     * is never left unanswered.
                     */
                    if (step_job) {
                        wakeBotsQueue();

                        return;
                    }
                }

                await enqueueBotReply({
                    user_id,
                    bot_id,
                    session_id: Number(session.id),
                    message_id: Number(message.id),
                    ...(plan_mode ? { params: { plan_mode: true } } : {}),
                });

                wakeBotsQueue();
            },
        });
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