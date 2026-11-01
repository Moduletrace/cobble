import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import canRetryChatroom from "@/src/utils/can-retry-chatroom";
import chatroomRetryNote from "@/src/utils/chatroom-retry-note";
import grabUserBot from "../bots/grab-user-bot";
import insertBotMessage from "../bots/insert-bot-message";
import closeChatroom from "./close-chatroom";
import enqueueChatroomTurn from "./enqueue-chatroom-turn";
import ensureChatroomSession from "./ensure-chatroom-session";
import grabChatroom from "./grab-chatroom";
import pushChatroomUpdated from "./push-chatroom-updated";

type Params = {
    chatroom_id: number | string;
    user_id: number | string;
};

/**
 * The room's user tries a failed or stopped request again: the same room
 * reopens with a fresh turn budget and the coordinator picks it up from
 * what was said, so the answer goes back the way a first one would. The
 * note goes in on the asking bot's side because the room's turns can't
 * end on the coordinator's own. Refused past
 * `AppData.ChatroomMaxOpenPerBot`, and for a room asked from inside
 * another room that has closed, since nothing is waiting on it there.
 * Returns false when it was reopened already.
 */
export default async function retryChatroom({ chatroom_id, user_id }: Params) {
    const room = await grabChatroom({ chatroom_id, user_id });

    if (!room?.id) {
        throw new AppError(`Chatroom not found.`);
    }

    if (room.status == "open") return false;

    if (!canRetryChatroom({ chatroom: room })) {
        throw new AppError(`Only a request that failed or was stopped can be tried again.`);
    }

    const requester = await grabUserBot({ bot_id: room.requester_bot_id || 0, user_id });

    if (!requester?.id) {
        throw new AppError(`The bot that asked is no longer one you work with.`);
    }

    if (room.parent_chatroom_id) {
        const parent = await grabChatroom({ chatroom_id: room.parent_chatroom_id });

        if (parent?.status != "open") {
            throw new AppError(`The request this one was part of has closed. Try that one again instead.`);
        }
    }

    const open = Number(
        (
            await BunSQLite.sql<{ n: number }>({
                sql: `SELECT COUNT(*) AS n FROM chatrooms WHERE user_id = ? AND requester_bot_id = ? AND status = 'open'`,
                values: [user_id, requester.id],
            })
        ).payload?.[0]?.n,
    );

    if (open >= AppData.ChatroomMaxOpenPerBot) {
        throw new AppError(`${requester.name} already has ${open} requests open. Wait for one to finish.`);
    }

    const now = Date.now();

    const reopened = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CHATROOMS>({
            sql: `UPDATE chatrooms SET status = 'open', outcome = NULL, closed_at = NULL, coordinator_turns = 0, last_activity_at = ?, updated_at = ?
                WHERE id = ? AND status = ?
                RETURNING *`,
            values: [now, now, room.id, room.status!],
        })
    ).payload?.[0];

    if (!reopened?.id) return false;

    /**
     * An open room with no turn queued would wait on nothing.
     */
    try {
        const session = await ensureChatroomSession({ chatroom: reopened, bot_id: requester.id });

        await pushBotNotice({
            bot_id: requester.id,
            message: await insertBotMessage({
                bot_id: requester.id,
                session_id: Number(session.id),
                workspace_id: reopened.workspace_id || null,
                text: chatroomRetryNote({ chatroom: room }),
            }),
        });

        await enqueueChatroomTurn({ chatroom: reopened });
    } catch (error) {
        await closeChatroom({ chatroom_id: reopened.id, status: "failed", outcome: `The request couldn't be tried again.` });
        throw error;
    }

    await pushChatroomUpdated({ chatroom_id: reopened.id });

    return true;
}
