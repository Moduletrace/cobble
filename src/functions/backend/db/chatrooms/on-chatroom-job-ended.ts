import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { logError } from "@/src/functions/backend/logger";
import closeChatroom from "./close-chatroom";
import enqueueChatroomTurn from "./enqueue-chatroom-turn";
import grabChatroom from "./grab-chatroom";
import grabSessionChatroomId from "./grab-session-chatroom-id";
import pushChatroomUpdated from "./push-chatroom-updated";

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    /**
     * What the job ended with: its result, or why it failed.
     */
    text?: string | null;
    failed?: boolean;
};

/**
 * Moves a room on when one of its jobs ends (done, failed, lost). An asked
 * bot's job wakes the coordinator, which reads what it said. A coordinator
 * turn that failed closes the room as failed; one that ended without
 * answering, refusing or leaving anyone at work answers with what it
 * said, so a room never waits on nothing. Not a room's job: nothing.
 */
export default async function onChatroomJobEnded({ job, text, failed }: Params) {
    try {
        const chatroom_id = await grabSessionChatroomId({ session_id: job.session_id });

        if (!chatroom_id) return;

        const room = await grabChatroom({ chatroom_id });

        if (!room?.id) return;

        if (room.status != "open") {
            await pushChatroomUpdated({ chatroom_id: room.id });
            return;
        }

        const is_coordinator = (
            await BunSQLite.sql<{ kind: string }>({
                sql: `SELECT kind FROM bots WHERE id = ? LIMIT 1`,
                values: [job.bot_id || 0],
            })
        ).payload?.[0]?.kind == "coordinator";

        if (!is_coordinator) {
            await enqueueChatroomTurn({ chatroom: room });
            await pushChatroomUpdated({ chatroom_id: room.id });
            return;
        }

        if (failed) {
            await closeChatroom({
                chatroom_id: room.id,
                status: "failed",
                outcome: `The coordinator couldn't work on it${text ? `: ${text}` : "."}`,
            });
            return;
        }

        const still_open = (
            await BunSQLite.sql({
                sql: `SELECT q.id FROM bots_queue q JOIN bot_sessions s ON s.id = q.session_id
                    WHERE s.chatroom_id = ? AND q.status IN ('pending', 'processing') AND q.id != ? LIMIT 1`,
                values: [room.id, job.id || 0],
            })
        ).payload?.[0];

        if (still_open) {
            await pushChatroomUpdated({ chatroom_id: room.id });
            return;
        }

        await closeChatroom({
            chatroom_id: room.id,
            status: text?.trim() ? "answered" : "failed",
            outcome: text?.trim() || `The coordinator ended without an answer.`,
        });
    } catch (error) {
        await logError({
            title: `Chatroom didn't move on after job #${job.id}`,
            error,
            metadata: { job_id: job.id, session_id: job.session_id },
        }).catch(() => {});
    }
}
