import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import type { ChatroomBot, ChatroomJob, ChatroomSummary } from "@/src/types";

type Params = {
    chatrooms: BUN_SQLITE_COBBLE_CHATROOMS[];
};

/**
 * Rooms with the bots in them, asking bot first, then the coordinator,
 * then the bots it asked in the order they joined, the jobs still open in
 * the room, and the workspace it's in by name.
 */
export default async function chatroomSummaries({ chatrooms }: Params): Promise<ChatroomSummary[]> {
    if (!chatrooms.length) return [];

    const ids = chatrooms.map((room) => Number(room.id));
    const marks = ids.map(() => "?").join(", ");

    const rows =
        (
            await BunSQLite.sql<ChatroomBot & { chatroom_id: number; session_id: number }>({
                sql: `SELECT s.chatroom_id, s.id AS session_id, b.id, b.name, b.kind, b.color, b.stone, b.hue, b.image_media_id
                    FROM bot_sessions s JOIN bots b ON b.id = s.bot_id
                    WHERE s.chatroom_id IN (${marks})
                    ORDER BY s.id ASC`,
                values: ids,
            })
        ).payload || [];

    const jobs =
        (
            await BunSQLite.sql<ChatroomJob & { chatroom_id: number }>({
                sql: `SELECT s.chatroom_id, q.bot_id, q.session_id, q.status, q.progress
                    FROM bots_queue q JOIN bot_sessions s ON s.id = q.session_id
                    WHERE s.chatroom_id IN (${marks}) AND q.status IN ('pending', 'processing')
                    ORDER BY q.id ASC`,
                values: ids,
            })
        ).payload || [];

    const workspace_ids = [...new Set(chatrooms.map((room) => Number(room.workspace_id)).filter(Boolean))];
    const workspace_names = new Map(
        (workspace_ids.length
            ? (
                  await BunSQLite.sql<{ id: number; name: string }>({
                      sql: `SELECT id, name FROM workspaces WHERE id IN (${workspace_ids.map(() => "?").join(", ")})`,
                      values: workspace_ids,
                  })
              ).payload || []
            : []
        ).map((row) => [Number(row.id), row.name]),
    );

    return chatrooms.map((room) => {
        const bots = rows
            .filter((row) => row.chatroom_id == room.id)
            .map(({ chatroom_id: _room, session_id: _session, ...bot }) => bot);

        const order = (bot: ChatroomBot) =>
            bot.id == room.requester_bot_id ? 0 : bot.kind == "coordinator" ? 1 : 2;

        return {
            ...room,
            bots: [...bots].sort((a, b) => order(a) - order(b)),
            working: jobs.some((job) => job.chatroom_id == room.id),
            jobs: jobs
                .filter((job) => job.chatroom_id == room.id)
                .map(({ chatroom_id: _room, ...job }) => ({
                    ...job,
                    bot_id: Number(job.bot_id),
                    session_id: Number(job.session_id),
                })),
            workspace_name: room.workspace_id ? workspace_names.get(Number(room.workspace_id)) || null : null,
        };
    });
}
