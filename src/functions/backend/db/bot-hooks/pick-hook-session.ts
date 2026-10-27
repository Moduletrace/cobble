import type { HookSessionChoice } from "@/src/types";
import AppError from "@/src/utils/app-error";
import grabUserBotSession from "../bot-sessions/grab-user-bot-session";
import startHookSession from "./start-hook-session";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    choice: HookSessionChoice;
    /**
     * The hook's title, which names a new session.
     */
    title: string;
    /**
     * A chosen session that's gone (or no longer in this conversation)
     * starts a new one instead of being refused: a hook's call, or a bot's
     * proposal confirmed after its session went.
     */
    missing_starts_new?: boolean;
};

/**
 * The session a hook saved with `choice` lands in: null to follow the
 * conversation's active one, a new one of its own, or one of the user's
 * sessions in that same conversation (refused otherwise).
 */
export default async function pickHookSession({
    user_id,
    bot_id,
    workspace_id,
    choice,
    title,
    missing_starts_new,
}: Params): Promise<number | null> {
    if (choice == "current") return null;

    if (choice != "new") {
        const session = await grabUserBotSession({ session_id: choice, user_id });
        const here =
            session?.id &&
            !session.chatroom_id &&
            Number(session.bot_id) == Number(bot_id) &&
            (Number(session.workspace_id) || null) == (Number(workspace_id) || null);

        if (here) return Number(session.id);

        if (!missing_starts_new) {
            throw new AppError(`That session isn't in this conversation.`);
        }
    }

    return await startHookSession({ user_id, bot_id, workspace_id, title });
}
