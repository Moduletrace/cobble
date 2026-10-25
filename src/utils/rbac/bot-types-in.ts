import type { BUN_SQLITE_COBBLE_BOT_TYPES } from "@/db/types/db";
import type { BotType } from "@/src/types";

export type BotTypeRow = Pick<BUN_SQLITE_COBBLE_BOT_TYPES, "bot_type"> & {
    /**
     * Null (or empty) for an install-wide type.
     */
    workspace_id?: number | "" | null;
};

type Params = {
    bot_types?: BotTypeRow[] | null;
    /**
     * Where the bot is working: its own chat (null) or a workspace.
     */
    workspace_id?: number | string | null;
};

/**
 * Strongest first, so a bot holding several is judged by the one that
 * reaches furthest.
 */
const BotTypeRank: BotType[] = ["coordinator", "admin", "worker"];

/**
 * The bot types that hold where the bot is working: install-wide rows
 * everywhere, workspace rows only in their workspace. Strongest first,
 * `worker` when nothing else holds.
 */
export default function botTypesIn({ bot_types, workspace_id }: Params): BotType[] {
    const held = new Set<BotType>();

    for (const row of bot_types || []) {
        if (!row.bot_type) continue;

        const applies = !row.workspace_id || (workspace_id && row.workspace_id == Number(workspace_id));

        if (applies) held.add(row.bot_type);
    }

    if (!held.size) held.add("worker");

    return BotTypeRank.filter((bt) => held.has(bt));
}
