import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import type { CrewRequest } from "@/src/types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The place they were asked from: a workspace's requests, or the bot's
     * own chat when left out.
     */
    workspace_id?: number | string | null;
    /**
     * How far back the ended ones go.
     */
    since: number;
};

/**
 * The requests a bot has out or recently had: what a task run needs in its
 * prompt, since it sees only its brief and would otherwise ask again for what
 * is on its way or already came back.
 */
export default async function grabCrewRequests({
    user_id,
    bot_id,
    workspace_id,
    since,
}: Params): Promise<CrewRequest[]> {
    const res = await BunSQLite.sql<CrewRequest>({
        sql: `SELECT id, title, status, updated_at FROM bot_asks
            WHERE user_id = ? AND requester_bot_id = ?
                AND (workspace_id = ? OR (? IS NULL AND workspace_id IS NULL))
                AND (status IN ('pending', 'working') OR updated_at >= ?)
            ORDER BY updated_at DESC
            LIMIT ?`,
        values: [
            Number(user_id),
            Number(bot_id),
            workspace_id ? Number(workspace_id) : null,
            workspace_id ? Number(workspace_id) : null,
            since,
            AppData.CrewRequestsListed,
        ],
    });

    return res.payload || [];
}
