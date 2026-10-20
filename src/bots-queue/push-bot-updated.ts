import grabBotAudience from "@/src/functions/backend/db/access/grab-bot-audience";
import { logError } from "@/src/functions/backend/logger";
import grabActiveBotTask from "@/src/functions/backend/db/bots/grab-active-bot-task";
import grabBotFace from "@/src/functions/backend/db/bots/grab-bot-face";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    bot_id: number | string;
    /**
     * Only this user: a face change, which is theirs alone. Else everyone
     * who sees the bot.
     */
    user_id?: number | null;
    /**
     * Only these users (the connected ones, for the live relay).
     */
    users?: Set<string>;
    /**
     * The computer the bot is on, when the push knows it (a switch, or the
     * live relay). Null means its main one.
     */
    computer_id?: number | null;
    /**
     * The workspaces the bot is in now, for a membership change: a
     * workspace's crew drops a bot that's no longer in it.
     */
    workspace_ids?: number[];
};

/**
 * Pushes `server:bot-updated` to one user, or everyone who sees the bot
 * (`grabBotAudience`), each with their own face, status line and active
 * task with it, never another user's. Best effort: a push that fails is
 * logged and never fails the change that caused it.
 */
export default async function pushBotUpdated({
    bot_id,
    user_id,
    users,
    computer_id,
    workspace_ids,
}: Params) {
    if (!bot_id) return;

    try {
        await push({ bot_id, user_id, users, computer_id, workspace_ids });
    } catch (error) {
        await logError({
            title: "Bot update wasn't pushed",
            error,
            metadata: { bot_id },
        }).catch(() => {});
    }
}

async function push({
    bot_id,
    user_id,
    users,
    computer_id,
    workspace_ids,
}: Params) {
    const audience = user_id ? [user_id] : await grabBotAudience({ bot_id });

    for (const viewer_id of audience) {
        if (users && !users.has(String(viewer_id))) continue;

        sendToUser({
            user_id: viewer_id,
            data: {
                event: "server:bot-updated",
                data: {
                    id: Number(bot_id),
                    ...(await grabBotFace({ bot_id, user_id: viewer_id })),
                    ...(computer_id !== undefined ? { computer_id: computer_id || null } : {}),
                    ...(workspace_ids !== undefined ? { workspace_ids } : {}),
                    task: await grabActiveBotTask({ bot_id, user_id: viewer_id }),
                },
            },
        });
    }
}
