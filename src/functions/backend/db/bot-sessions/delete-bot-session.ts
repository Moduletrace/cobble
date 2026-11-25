import AppError from "@/src/utils/app-error";
import deleteSessionRows from "./delete-session-rows";
import grabUserBotSession from "./grab-user-bot-session";
import hasOpenSessionJob from "./has-open-session-job";
import startBotSession from "./start-bot-session";

type Params = {
    session_id: number | string;
    user_id: number | string;
};

/**
 * Deletes one of the user's sessions and everything in it. Deleting the
 * active one hands the conversation a fresh session, since a conversation
 * always has one to write in. A session with a run in progress is refused:
 * the run would keep writing into rows that are gone.
 */
export default async function deleteBotSession({
    session_id,
    user_id,
}: Params): Promise<void> {
    const session = await grabUserBotSession({ session_id, user_id });

    if (!session?.id) {
        throw new AppError(`Session not found.`);
    }

    /**
     * A bot's part of a crew request is only ever read there.
     */
    if (session.ask_id) {
        throw new AppError(`Session not found.`);
    }

    if (await hasOpenSessionJob({ session_id: session.id })) {
        throw new AppError(`This session has a run in progress. Stop it first, then delete the session.`);
    }

    await deleteSessionRows({ session_ids: [session.id] });

    if (session.status != "active") return;

    await startBotSession({
        user_id: session.user_id!,
        bot_id: session.bot_id!,
        workspace_id: session.workspace_id,
    });
}