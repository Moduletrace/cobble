import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_SESSIONS, BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import type { ChatroomStatus } from "@/src/dict/chatroom-dict";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import { logError } from "@/src/functions/backend/logger";
import enqueueBotReply from "../bots-queue/enqueue-bot-reply";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import grabUserBot from "../bots/grab-user-bot";
import insertUserMessage from "../bots/insert-user-message";
import cancelChatroomJobs from "./cancel-chatroom-jobs";
import chatroomOutcomeMessage from "./chatroom-outcome-message";
import pushChatroomUpdated from "./push-chatroom-updated";
import pruneChatrooms from "./prune-chatrooms";

type Params = {
    chatroom_id: number | string;
    status: Exclude<ChatroomStatus, "open">;
    /**
     * What goes back to the asking bot: the answer, or why there is none.
     */
    outcome: string;
    /**
     * The job closing it (the coordinator's turn), left to finish.
     */
    job_id?: number | string | null;
};

/**
 * Closes an open room once: its outcome is kept, whatever in it could
 * still run is cancelled, and the outcome goes back to the asking bot in
 * the conversation it asked from (its active session there if that one
 * was closed since, or the room it was itself working in), on the user's
 * side so the bot answers it, which it is woken to do. A room the user
 * stopped only tells it. Returns false when the room was already closed.
 */
export default async function closeChatroom({ chatroom_id, status, outcome, job_id }: Params) {
    const now = Date.now();

    const room = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CHATROOMS>({
            sql: `UPDATE chatrooms SET status = ?, outcome = ?, closed_at = ?, last_activity_at = ?, unread = 1, updated_at = ?
                WHERE id = ? AND status = 'open'
                RETURNING *`,
            values: [status, outcome, now, now, now, chatroom_id],
        })
    ).payload?.[0];

    if (!room?.id) return false;

    await cancelChatroomJobs({
        chatroom_id: room.id,
        reason: status == "stopped" ? "Stopped by the user" : "The chatroom closed",
        except_job_id: job_id,
    });

    try {
        await tellRequester({ room, status, outcome });
    } catch (error) {
        await logError({
            title: `Chatroom #${room.id}'s outcome didn't reach the asking bot`,
            error,
            user_id: room.user_id || undefined,
            metadata: { chatroom_id: room.id, status },
        }).catch(() => {});
    }

    await pushChatroomUpdated({ chatroom_id: room.id });

    /**
     * A place keeps only so many rooms: closing one may push the oldest
     * closed ones there out.
     */
    await pruneChatrooms({ workspace_id: Number(room.workspace_id) || null }).catch(async (error) => {
        await logError({ title: "Chatrooms weren't pruned", error, metadata: { chatroom_id: room.id } }).catch(() => {});
    });

    return true;
}

async function tellRequester({
    room,
    status,
    outcome,
}: {
    room: BUN_SQLITE_COBBLE_CHATROOMS;
    status: ChatroomStatus;
    outcome: string;
}) {
    if (!room.user_id || !room.requester_bot_id) return;

    const requester = await grabUserBot({ bot_id: room.requester_bot_id, user_id: room.user_id });

    if (!requester?.id) return;

    const session = await pickRequesterSession({ room, bot_id: requester.id });

    const message = await insertUserMessage({
        bot_id: requester.id,
        session_id: Number(session.id),
        workspace_id: session.workspace_id || null,
        text: chatroomOutcomeMessage({ chatroom_id: room.id!, title: room.title, status, outcome }),
        from_chatroom_id: Number(room.id),
    });

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET unread = 1 WHERE id = ?`,
        values: [session.id!],
    });

    await pushBotNotice({ bot_id: requester.id, message });

    if (status == "stopped") return;

    await enqueueBotReply({
        user_id: room.user_id,
        bot_id: requester.id,
        session_id: Number(session.id),
        message_id: Number(message.id),
    });
}

/**
 * The asking bot's session the outcome goes in: the one it asked from
 * while that's still where it talks (active, or its part of the room it
 * was working in), else its conversation's active session there.
 */
async function pickRequesterSession({
    room,
    bot_id,
}: {
    room: BUN_SQLITE_COBBLE_CHATROOMS;
    bot_id: number;
}): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const origin = room.origin_session_id
        ? (
              await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
                  sql: `SELECT * FROM bot_sessions WHERE id = ? AND bot_id = ? AND user_id = ? LIMIT 1`,
                  values: [room.origin_session_id, bot_id, room.user_id!],
              })
          ).payload?.[0]
        : null;

    if (origin?.id && origin.status == "active") return origin;

    /**
     * Asked from inside another room: the answer goes back there while
     * that room is still waiting on it.
     */
    if (origin?.id && origin.chatroom_id) {
        const parent = (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_CHATROOMS>({
                sql: `SELECT status FROM chatrooms WHERE id = ? LIMIT 1`,
                values: [origin.chatroom_id],
            })
        ).payload?.[0];

        if (parent?.status == "open") return origin;
    }

    return await ensureBotSession({
        user_id: room.user_id!,
        bot_id,
        workspace_id: origin?.id ? origin.workspace_id || null : room.workspace_id || null,
    });
}
