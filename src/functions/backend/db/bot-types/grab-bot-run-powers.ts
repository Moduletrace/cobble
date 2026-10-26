import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotKind } from "@/src/dict/bot-dict";
import type { BotPermission } from "@/src/types";
import botCan from "@/src/utils/rbac/bot-can";
import type { BotTypeRow } from "@/src/utils/rbac/bot-types-in";
import grabBotTypes from "./grab-bot-types";

type Params = {
    bot_id: number | string;
    /**
     * Where the run works: its own chat (null) or a workspace.
     */
    workspace_id?: number | string | null;
};

export type BotRunPowers = {
    bot_types: BotTypeRow[];
    /**
     * Its kind is `coordinator`.
     */
    is_coordinator: boolean;
    /**
     * The workspaces it's admin of.
     */
    admin_workspace_ids: number[];
    /**
     * Admin of the workspace the run is in.
     */
    is_workspace_admin: boolean;
    /**
     * Whether its kind and types allow `permission` where the run works. The bot's
     * side only: the run's user must still be allowed.
     */
    can: (permission: BotPermission) => boolean;
};

/**
 * What a bot's kind and types let it do on one run, read once
 * (`grabBotTypes`).
 */
export default async function grabBotRunPowers({ bot_id, workspace_id }: Params): Promise<BotRunPowers> {
    const bot_types = await grabBotTypes({ bot_id });

    const bot = await BunSQLite.sql<{ kind: BotKind | null }>({
        sql: `SELECT kind FROM bots WHERE id = ? LIMIT 1`,
        values: [Number(bot_id)],
    });

    const kind = bot.payload?.[0]?.kind || "worker";

    const admin_workspace_ids = bot_types
        .filter((bt) => bt.bot_type == "workspace_admin" && bt.workspace_id)
        .map((bt) => Number(bt.workspace_id));

    return {
        bot_types,
        is_coordinator: kind == "coordinator",
        admin_workspace_ids,
        is_workspace_admin: Boolean(workspace_id && admin_workspace_ids.includes(Number(workspace_id))),
        can: (permission) => botCan({ kind, bot_types, permission, workspace_id }),
    };
}
