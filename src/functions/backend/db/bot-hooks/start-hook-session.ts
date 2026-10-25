import { AppData } from "@/src/data/app-data";
import createBotSession from "../bot-sessions/create-bot-session";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The hook's title, which names the session.
     */
    title: string;
};

/**
 * Starts a hook's own session in the conversation, beside the active one
 * (closed, so the chat on screen stays as it is). It shows in the
 * conversation's sessions once something lands in it. Returns its id.
 */
export default async function startHookSession({ user_id, bot_id, workspace_id, title }: Params) {
    const session = await createBotSession({
        user_id,
        bot_id,
        workspace_id,
        status: "closed",
        title: `Hook: ${title}`.slice(0, AppData.BotSessionTitleMaxChars),
    });

    return Number(session.id);
}
