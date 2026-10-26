import BunSQLite from "@moduletrace/bun-sqlite";
import { BotTypes } from "@/src/dict/bot-types-dict";
import type { BotType } from "@/src/types";
import AppError from "@/src/utils/app-error";
import botTypeAssignment from "@/src/utils/rbac/bot-type-assignment";
import grabUserBot from "../bots/grab-user-bot";
import grabUserTypes from "../users/grab-user-types";
import grabUserWorkspace from "../workspaces/grab-user-workspace";
import grabBotRunPowers from "./grab-bot-run-powers";

export type BotTypeChangeParams = {
    /**
     * The user making the change, or the user a granting bot runs for.
     */
    user_id: number | string;
    /**
     * The bot making the change from chat (the coordinator), if any: it
     * must be allowed as well as the user.
     */
    actor_bot_id?: number | string | null;
    bot_id: number | string;
    bot_type: BotType;
    workspace_id?: number | string | null;
};

/**
 * Checks a grant or removal of a bot type: the user (and the bot, when one
 * acts) may do it (`botTypeAssignment`), the type exists, and the bot
 * works in the workspace. Returns the bot and the workspace id.
 */
export default async function assertBotTypeChange({
    user_id,
    actor_bot_id,
    bot_id,
    bot_type,
    workspace_id,
    action,
}: BotTypeChangeParams & { action: "assign" | "delete" }) {
    const type = BotTypes.find((bt) => bt.value == bot_type);

    if (!type) {
        throw new AppError(`There's no such bot type.`);
    }

    if (!workspace_id) {
        throw new AppError(`Pick the workspace the bot is ${type.title.toLowerCase()} of.`);
    }

    const user_types = await grabUserTypes({ user_id });

    if (!botTypeAssignment({ actor_user_types: user_types, target_bot_type: bot_type, action })) {
        throw new AppError(`Only an admin can do that.`);
    }

    if (actor_bot_id) {
        const actor = await grabBotRunPowers({ bot_id: actor_bot_id });
        const actor_bot = { kind: actor.is_coordinator ? ("coordinator" as const) : ("worker" as const), bot_types: actor.bot_types };

        if (!botTypeAssignment({ actor_bot, target_bot_type: bot_type, action })) {
            throw new AppError(`Only the coordinator can do that.`);
        }
    }

    const bot = await grabUserBot({ bot_id, user_id });
    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!bot?.id || !workspace?.id) {
        throw new AppError(`Bot or workspace not found.`);
    }

    if (bot.kind == "coordinator") {
        throw new AppError(`The coordinator already leads every workspace.`);
    }

    if (action == "assign") {
        const member = await BunSQLite.sql<{ n: number }>({
            sql: `SELECT COUNT(*) AS n FROM workspace_bots WHERE workspace_id = ? AND bot_id = ?`,
            values: [workspace.id, bot.id],
        });

        if (!member.payload?.[0]?.n) {
            throw new AppError(`${bot.name} isn't in ${workspace.name}. Add it to the workspace first.`);
        }
    }

    return { bot, workspace };
}
