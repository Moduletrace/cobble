import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import insertBotMessage from "../bots/insert-bot-message";

type Params = {
    bot_id: number | string;
    session_id: number;
    workspace_id?: number | null;
    title: string;
};

/**
 * Says in a hook's own session that its calls land there, so a new one
 * shows in the conversation's sessions right away.
 */
export default async function noteHookSession({ bot_id, session_id, workspace_id, title }: Params) {
    await pushBotNotice({
        bot_id: Number(bot_id),
        message: await insertBotMessage({
            bot_id: Number(bot_id),
            session_id,
            workspace_id: workspace_id || null,
            text: `Calls to the hook **${title}** run in this session from now on.`,
        }),
    });
}
