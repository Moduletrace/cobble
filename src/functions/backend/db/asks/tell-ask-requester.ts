import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import enqueueBotReply from "../bots-queue/enqueue-bot-reply";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import grabUserBot from "../bots/grab-user-bot";
import grabUserBotSession from "../bot-sessions/grab-user-bot-session";
import insertUserMessage from "../bots/insert-user-message";

type Params = {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
    /**
     * The whole user-side message, already built and stripped of question
     * refs (a question stays in the conversation it was asked in).
     */
    text: string;
    /**
     * Wake the bot that asked with a reply (a stopped run isn't woken).
     */
    wake?: boolean;
};

/**
 * Posts a crew request's word back to the bot that asked, on the user's
 * side of the conversation it asked from (`from_ask_id`), which wakes it
 * with a reply. The origin session when it is still the active one (the
 * user is still there); otherwise the bot's current conversation, so the
 * outcome isn't lost in a closed thread. Shared by the final outcome
 * (`finishAsk`) and the results that come back while the request is still
 * open, so every one of them lands in the same place.
 */
export default async function tellAskRequester({ ask, text, wake = true }: Params) {
    const requester = await grabUserBot({ bot_id: Number(ask.requester_bot_id)!, user_id: Number(ask.user_id)! });

    if (!requester?.id) return null;

    const origin = await grabUserBotSession({ session_id: ask.origin_session_id!, user_id: Number(ask.user_id)! });

    const session =
        origin?.status == "active"
            ? origin
            : await ensureBotSession({
                  user_id: Number(ask.user_id)!,
                  bot_id: requester.id,
                  workspace_id: Number(ask.workspace_id) || null,
              });

    if (!session?.id) {
        throw new AppError(`Couldn't find the conversation this request came from.`);
    }

    const message = await insertUserMessage({
        bot_id: requester.id,
        session_id: session.id,
        workspace_id: Number(ask.workspace_id) || null,
        text,
        from_ask_id: Number(ask.id),
    });

    await pushBotNotice({ bot_id: requester.id, message });

    if (wake) {
        await enqueueBotReply({
            user_id: Number(ask.user_id)!,
            bot_id: requester.id,
            session_id: session.id,
            message_id: message.id!,
        });
    }

    return { session_id: session.id, message };
}
