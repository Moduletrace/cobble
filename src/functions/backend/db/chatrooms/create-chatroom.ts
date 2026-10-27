import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_CHATROOMS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import insertBotMessage from "../bots/insert-bot-message";
import grabUserBotSession from "../bot-sessions/grab-user-bot-session";
import chatroomAncestry from "./chatroom-ancestry";
import enqueueChatroomTurn from "./enqueue-chatroom-turn";
import ensureChatroomSession from "./ensure-chatroom-session";
import pushChatroomUpdated from "./push-chatroom-updated";

type Params = {
    user_id: number | string;
    /**
     * The worker asking. Never the coordinator, which hands work over
     * itself.
     */
    requester: BUN_SQLITE_COBBLE_BOTS;
    /**
     * The session it asks from: the answer goes back there.
     */
    origin_session_id: number | string;
    title: string;
    request: string;
};

/**
 * Opens a chatroom for a worker's request: the room (in the workspace the
 * request came from, if any), the request as the asking bot's first
 * message there, and the coordinator's first turn. Refused for the
 * coordinator, past `AppData.ChatroomMaxOpenPerBot` open rooms for that
 * bot and user, and past `AppData.ChatroomMaxDepth` nested rooms.
 */
export default async function createChatroom({
    user_id,
    requester,
    origin_session_id,
    title,
    request,
}: Params): Promise<BUN_SQLITE_COBBLE_CHATROOMS> {
    if (!requester.id || requester.kind == "coordinator") {
        throw new AppError(`Only a worker asks the crew through the coordinator.`);
    }

    const origin = await grabUserBotSession({ session_id: origin_session_id, user_id });

    if (!origin?.id || origin.bot_id != requester.id) {
        throw new AppError(`Session not found.`);
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
        throw new AppError(
            `You already have ${open} requests open with the coordinator. Wait for an answer before asking again.`,
        );
    }

    const parent_chatroom_id = origin.chatroom_id ? Number(origin.chatroom_id) : null;
    const ancestry = await chatroomAncestry({ chatroom_id: parent_chatroom_id });

    if (ancestry.length >= AppData.ChatroomMaxDepth) {
        throw new AppError(
            `This request was already passed along ${ancestry.length} times. Answer with what you have instead of asking someone else.`,
        );
    }

    const now = Date.now();
    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_CHATROOMS, (typeof BunSQLiteTables)[number]>({
        table: "chatrooms",
        data: [
            {
                user_id: Number(user_id),
                workspace_id: origin.workspace_id || undefined,
                requester_bot_id: requester.id,
                origin_session_id: origin.id,
                parent_chatroom_id: parent_chatroom_id || undefined,
                title,
                request,
                status: "open",
                coordinator_turns: 0,
                unread: 1,
                last_activity_at: now,
            },
        ],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Couldn't open the chatroom: ${res.msg}`);
    }

    const room = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CHATROOMS>({
            sql: `SELECT * FROM chatrooms WHERE id = ? LIMIT 1`,
            values: [id],
        })
    ).payload?.[0];

    if (!room?.id) {
        throw new Error(`Couldn't open the chatroom.`);
    }

    const session = await ensureChatroomSession({ chatroom: room, bot_id: requester.id });

    await insertBotMessage({
        bot_id: requester.id,
        session_id: Number(session.id),
        workspace_id: room.workspace_id || null,
        text: `**${title}**\n\n${request}`,
    });

    await enqueueChatroomTurn({ chatroom: room });
    await pushChatroomUpdated({ chatroom_id: room.id });

    return room;
}
