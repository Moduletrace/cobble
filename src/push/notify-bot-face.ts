import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotFaceChange } from "@/src/functions/backend/db/bots/set-bot-face";
import { logError } from "@/src/functions/backend/logger";
import { pushNeedsYouTag, truncatePushBody } from "@/src/dict/push-dict";
import isUserPresent from "@/src/functions/backend/db/push/is-user-present";
import deliverToUser from "./deliver-to-user";

type Row = {
    bot_name: string | null;
    workspace_id: number | null;
    session_id: number | null;
};

/**
 * A bot changing to needs-you without posting a message (a task that
 * finished running into something only the user can solve). Messages that
 * carry needs-you already notify from `notifyBotMessage`.
 */
export default async function notifyBotFace({
    bot,
}: {
    bot: BotFaceChange;
}) {
    try {
        if (bot.face != "needs-you") return;

        if (await isUserPresent({ user_id: bot.user_id })) return;

        const row = (
            await BunSQLite.sql<Row>({
                sql: `SELECT b.name AS bot_name, s.workspace_id, s.id AS session_id
                    FROM bots b
                    LEFT JOIN bot_sessions s ON s.bot_id = b.id AND s.user_id = ? AND s.status = 'active'
                    WHERE b.id = ?
                    ORDER BY s.last_activity_at DESC
                    LIMIT 1`,
                values: [bot.user_id, bot.id],
            })
        ).payload?.[0];

        const bot_name = row?.bot_name || "A bot";
        const url = row?.workspace_id
            ? `/admin/workspaces/${row.workspace_id}/bots/${bot.id}`
            : `/admin/bots/${bot.id}`;

        await deliverToUser({
            user_id: bot.user_id,
            payload: {
                title: `${bot_name} needs you`,
                body: truncatePushBody(
                    bot.status_line || "Open the conversation to carry on.",
                ),
                url,
                tag: pushNeedsYouTag({ bot_id: bot.id }),
                requireInteraction: true,
            },
        });
    } catch (error) {
        await logError({
            title: "Could not send a needs-you notification",
            error,
            metadata: { bot_id: bot.id, user_id: bot.user_id },
        }).catch(() => {});
    }
}
