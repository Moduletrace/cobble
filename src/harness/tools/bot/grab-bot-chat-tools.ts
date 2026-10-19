import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import type { HarnessTool } from "../../types";
import delegateTaskTool from "./delegate-task-tool";
import grabBotTools from "./grab-bot-tools";
import startTaskTool from "./start-task-tool";

type Params = {
    bot: BUN_SQLITE_COBBLE_BOTS;
    user_id: number | string;
    /**
     * The user message being answered.
     */
    message_id?: number | string;
};

/**
 * The tools a bot replies in chat with: its own (memory, instructions),
 * start_task for longer work, and for the coordinator delegate_task to
 * the crew. Computers are reached through tasks, never mid-reply.
 */
export default async function grabBotChatTools({
    bot,
    user_id,
    message_id,
}: Params): Promise<HarnessTool[]> {
    const bot_id = bot.id || 0;
    const tools = [
        ...grabBotTools({ user_id, bot_id }),
        startTaskTool({
            user_id,
            bot_id,
            computers: await grabBotComputers({ bot_id, user_id }),
            message_id,
        }),
    ];

    if (bot.kind != "coordinator") return tools;

    const workers =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
                sql: `SELECT * FROM bots WHERE user_id = ? AND kind = 'worker' ORDER BY id ASC`,
                values: [user_id],
            })
        ).payload || [];

    if (workers.length) {
        tools.push(
            delegateTaskTool({
                user_id,
                coordinator_name: bot.name || "The coordinator",
                workers,
            }),
        );
    }

    return tools;
}
