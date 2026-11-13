import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_SUGGESTIONS, BunSQLiteTables } from "@/db/types/db";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    title: string;
    steps: string[];
};

/**
 * Stores next steps a bot suggests under its answer, read back as buttons
 * that put a step in the user's input. Returns its id.
 */
export default async function createBotSuggestion({ user_id, bot_id, session_id, workspace_id, title, steps }: Params) {
    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_SUGGESTIONS, (typeof BunSQLiteTables)[number]>({
        table: "bot_suggestions",
        data: [
            {
                title,
                steps: JSON.stringify(steps),
                user_id: Number(user_id),
                bot_id: Number(bot_id),
                session_id: Number(session_id),
                workspace_id: workspace_id ? Number(workspace_id) : undefined,
            },
        ],
    });

    const id = Number(res.singleRes?.id || res.postInsertReturn?.insertId);

    if (!res.success || !id) throw new Error(`Couldn't store the suggested next steps: ${res.msg}`);

    return id;
}