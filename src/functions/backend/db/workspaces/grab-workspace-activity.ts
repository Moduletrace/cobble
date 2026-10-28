import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import type { WorkspaceActivityItem } from "@/src/types";
import botFaceSql from "@/src/utils/bot-face-sql";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
};

/**
 * The user's latest conversations in a workspace, most recent first, each
 * with the bot it's with (its face as the user sees it), its message count, first and latest message. Sessions
 * with no messages yet are left out, active or not.
 */
export default async function grabWorkspaceActivity({
    user_id,
    workspace_id,
}: Params): Promise<WorkspaceActivityItem[]> {
    const face = botFaceSql({ user_id, prefix: "bot_" });

    const res = await BunSQLite.sql<WorkspaceActivityItem>({
        sql: `SELECT s.*,
                b.name AS bot_name,
                b.image_media_id AS bot_image_media_id,
                b.hue AS bot_hue,
                b.color AS bot_color,
                b.stone AS bot_stone,
                ${face.sql},
                (SELECT COUNT(*) FROM bot_messages m WHERE m.session_id = s.id) AS message_count,
                (SELECT m.text FROM bot_messages m WHERE m.session_id = s.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message_text,
                (SELECT m.text FROM bot_messages m WHERE m.session_id = s.id ORDER BY m.created_at ASC, m.id ASC LIMIT 1) AS first_message_text
            FROM bot_sessions s
            JOIN bots b ON b.id = s.bot_id
            WHERE s.workspace_id = ? AND s.user_id = ? AND s.chatroom_id IS NULL
            AND EXISTS (SELECT 1 FROM bot_messages m WHERE m.session_id = s.id)
            AND (b.kind = 'coordinator' OR EXISTS (
                SELECT 1 FROM workspace_bots wb WHERE wb.workspace_id = s.workspace_id AND wb.bot_id = s.bot_id
            ))
            ORDER BY COALESCE(s.last_activity_at, s.created_at) DESC, s.id DESC
            LIMIT ?`,
        values: [...face.values, workspace_id, user_id, AppData.WorkspaceActivityItems],
    });

    return res.payload || [];
}
