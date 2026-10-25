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
     * Holds the install-wide coordinator type.
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
     * Whether its types allow `permission` where the run works. The bot's
     * side only: the run's user must still be allowed.
     */
    can: (permission: BotPermission) => boolean;
};

/**
 * What a bot's types let it do on one run, read once (`grabBotTypes`).
 */
export default async function grabBotRunPowers({ bot_id, workspace_id }: Params): Promise<BotRunPowers> {
    const bot_types = await grabBotTypes({ bot_id });

    const admin_workspace_ids = bot_types
        .filter((bt) => bt.bot_type == "admin" && bt.workspace_id)
        .map((bt) => Number(bt.workspace_id));

    return {
        bot_types,
        is_coordinator: bot_types.some((bt) => bt.bot_type == "coordinator" && !bt.workspace_id),
        admin_workspace_ids,
        is_workspace_admin: Boolean(workspace_id && admin_workspace_ids.includes(Number(workspace_id))),
        can: (permission) => botCan({ bot_types, permission, workspace_id }),
    };
}
