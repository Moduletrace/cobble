import type { BotSessionChangedData } from "@/src/types";
import pushToSessionUser from "./push-to-session-user";

type Params = {
    session_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
};

/**
 * Tells the open tabs of the user a session belongs to that it started or
 * changed, so the rail and the sessions list reload it.
 */
export default async function pushBotSession({
    session_id,
    bot_id,
    workspace_id,
}: Params) {
    const data: BotSessionChangedData = {
        session_id: Number(session_id),
        bot_id: Number(bot_id),
        workspace_id: workspace_id ? Number(workspace_id) : null,
    };

    await pushToSessionUser({
        session_id,
        data: { event: "server:bot-session", data },
    });
}
