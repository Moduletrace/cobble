import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE, BUN_SQLITE_COBBLE_CHATROOMS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { ChatroomTurnJobTitle } from "@/src/dict/chatroom-dict";
import wakeBotsQueue from "@/src/bots-queue/wake-bots-queue";
import pushChatroomUpdated from "./push-chatroom-updated";
import closeChatroom from "./close-chatroom";
import ensureChatroomSession from "./ensure-chatroom-session";
import grabCoordinatorBot from "./grab-coordinator-bot";

type Params = {
    chatroom: BUN_SQLITE_COBBLE_CHATROOMS;
};

/**
 * Queues the coordinator's next turn in an open room: it reads the room
 * and asks someone, answers or refuses. Queued straight onto the queue
 * rather than through `enqueueBotJob`, since in a member's room the
 * coordinator works for a user who doesn't reach it otherwise; the room
 * is what was checked. A turn already waiting is reused. Past
 * `AppData.ChatroomMaxCoordinatorTurns` the room closes as failed.
 */
export default async function enqueueChatroomTurn({ chatroom }: Params) {
    if (!chatroom.id || chatroom.status != "open") return null;

    const coordinator = await grabCoordinatorBot();

    if (!coordinator?.id) {
        await closeChatroom({
            chatroom_id: chatroom.id,
            status: "failed",
            outcome: `There is no coordinator to pass the request on.`,
        });
        return null;
    }

    const session = await ensureChatroomSession({ chatroom, bot_id: coordinator.id });

    const pending = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
            sql: `SELECT id FROM bots_queue WHERE session_id = ? AND status = 'pending' LIMIT 1`,
            values: [session.id!],
        })
    ).payload?.[0];

    if (pending?.id) return Number(pending.id);

    /**
     * Counted as it's queued, atomically, so two jobs ending at once can't
     * both slip under the cap.
     */
    const counted = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CHATROOMS>({
            sql: `UPDATE chatrooms SET coordinator_turns = coordinator_turns + 1, updated_at = ?
                WHERE id = ? AND status = 'open' AND coordinator_turns < ?
                RETURNING id`,
            values: [Date.now(), chatroom.id, AppData.ChatroomMaxCoordinatorTurns],
        })
    ).payload?.[0];

    if (!counted?.id) {
        await closeChatroom({
            chatroom_id: chatroom.id,
            status: "failed",
            outcome: `The coordinator ran out of turns on this request (${AppData.ChatroomMaxCoordinatorTurns}) without an answer.`,
        });
        return null;
    }

    const res = await BunSQLite.queue.add<BUN_SQLITE_COBBLE_BOTS_QUEUE, (typeof BunSQLiteTables)[number]>({
        table: "bots_queue",
        data: [
            {
                kind: "reply",
                bot_id: coordinator.id,
                session_id: session.id,
                workspace_id: chatroom.workspace_id || undefined,
                title: ChatroomTurnJobTitle,
                instructions: `Work the request in chatroom #${chatroom.id}.`,
                params: JSON.stringify({ chatroom_id: chatroom.id }),
            },
        ],
    });

    const job_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !job_id) {
        throw new Error(`Couldn't queue the coordinator's turn: ${res.msg || res.error}`);
    }

    wakeBotsQueue();

    /**
     * The room's status rows show the coordinator is up.
     */
    await pushChatroomUpdated({ chatroom_id: chatroom.id! }).catch(() => {});

    return Number(job_id);
}
