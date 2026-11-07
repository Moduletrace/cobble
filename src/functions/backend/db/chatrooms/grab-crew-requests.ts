import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";

type Params = {
    user_id: number | string;
    /**
     * The bot that asked.
     */
    bot_id: number | string;
    /**
     * The place it asked from: rooms are kept per place, like
     * conversations.
     */
    workspace_id?: number | string | null;
    /**
     * Rooms closed before this aren't listed (open ones always are).
     * Defaults to `AppData.CrewRequestsRecentMs` ago.
     */
    since?: number;
};

export type CrewRequest = Pick<BUN_SQLITE_COBBLE_CHATROOMS, "id" | "title" | "status" | "closed_at">;

/**
 * A bot's requests to the crew from one place, for one user: every open
 * room and the ones closed lately, newest first. A task run gets only its
 * brief, so without these it didn't know a request was already open or
 * answered, and asked the crew for the same files three times.
 */
export default async function grabCrewRequests({ user_id, bot_id, workspace_id, since }: Params): Promise<CrewRequest[]> {
    const res = await BunSQLite.sql<CrewRequest>({
        sql: `SELECT id, title, status, closed_at FROM chatrooms
            WHERE user_id = ? AND requester_bot_id = ? AND workspace_id IS ?
                AND (status = 'open' OR closed_at >= ?)
            ORDER BY id DESC
            LIMIT ?`,
        values: [
            Number(user_id),
            Number(bot_id),
            workspace_id ? Number(workspace_id) : null,
            since ?? Date.now() - AppData.CrewRequestsRecentMs,
            AppData.CrewRequestsListed,
        ],
    });

    return res.payload || [];
}
