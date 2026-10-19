import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import { logError } from "@/src/functions/backend/logger";
import { pushMessageTag, truncatePushBody } from "@/src/dict/push-dict";
import messagePreview from "@/src/utils/message-preview";
import isUserPresent from "@/src/functions/backend/db/push/is-user-present";
import deliverToUser from "./deliver-to-user";

type Row = {
    user_id: number;
    workspace_id: number | null;
    workspace_name: string | null;
    bot_name: string | null;
};

/**
 * A bot's message in one of the user's conversations. Only the bot's own
 * messages notify; the user's are already on their screen. Skipped while
 * the app is open anywhere.
 */
export default async function notifyBotMessage({
    message,
}: {
    message: BUN_SQLITE_COBBLE_BOT_MESSAGES;
}) {
    try {
        const bot_id = Number(message.bot_id);
        const session_id = Number(message.session_id);

        if (message.author != "bot" || !bot_id || !session_id) return;

        const row = (
            await BunSQLite.sql<Row>({
                sql: `SELECT s.user_id, s.workspace_id, w.name AS workspace_name, b.name AS bot_name
                    FROM bot_sessions s
                    LEFT JOIN workspaces w ON w.id = s.workspace_id
                    LEFT JOIN bots b ON b.id = ?
                    WHERE s.id = ? LIMIT 1`,
                values: [bot_id, session_id],
            })
        ).payload?.[0];

        if (!row?.user_id) return;

        if (await isUserPresent({ user_id: row.user_id })) return;

        const preview = messagePreview({ text: message.text || "" });
        const body = preview
            ? truncatePushBody(preview)
            : "Sent you an attachment.";

        const bot_name = row.bot_name || "A bot";
        const title = row.workspace_name
            ? `${bot_name} in ${row.workspace_name}`
            : bot_name;

        const url = row.workspace_id
            ? `/admin/workspaces/${row.workspace_id}/bots/${bot_id}`
            : `/admin/bots/${bot_id}`;

        await deliverToUser({
            user_id: row.user_id,
            payload: {
                title,
                body,
                url,
                tag: pushMessageTag({
                    bot_id,
                    session_id,
                }),
                requireInteraction: Boolean(message.needs_you),
            },
        });
    } catch (error) {
        await logError({
            title: "Could not send a message notification",
            error,
            metadata: { message_id: message.id },
        }).catch(() => {});
    }
}
