import type { BUN_SQLITE_COBBLE_BOT_TYPES } from "@/db/types/db";
import type { BotKind } from "@/src/dict/bot-dict";
import type { BotRole } from "@/src/types";

export type BotTypeRow = Pick<BUN_SQLITE_COBBLE_BOT_TYPES, "bot_type"> & {
    /**
     * The workspace the type holds in.
     */
    workspace_id?: number | "" | null;
};

type Params = {
    /**
     * The bot's kind (`bots.kind`): a worker when missing.
     */
    kind?: BotKind | "" | null;
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
const BotRoleRank: BotRole[] = ["coordinator", "workspace_admin", "worker"];

/**
 * The roles a bot holds where it's working: the coordinator kind
 * everywhere, a type only in its workspace. Strongest first, `worker` when
 * nothing else holds.
 */
export default function botTypesIn({ kind, bot_types, workspace_id }: Params): BotRole[] {
    const held = new Set<BotRole>();

    if (kind == "coordinator") held.add("coordinator");

    for (const row of bot_types || []) {
        if (!row.bot_type || !row.workspace_id || !workspace_id) continue;

        if (row.workspace_id == Number(workspace_id)) held.add(row.bot_type);
    }

    if (!held.size) held.add("worker");

    return BotRoleRank.filter((role) => held.has(role));
}
