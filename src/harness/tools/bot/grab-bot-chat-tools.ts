import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import type { HarnessTool } from "../../types";
import searchComputersTool from "../computer/search-computers-tool";
import assignComputerTool from "./assign-computer-tool";
import delegateTaskTool from "./delegate-task-tool";
import grabBotTools from "./grab-bot-tools";
import startTaskTool from "./start-task-tool";

type Params = {
    bot: BUN_SQLITE_COBBLE_BOTS;
    user_id: number | string;
    /**
     * The bot's computers, the current one first (`grabBotComputers`).
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * The user message being answered.
     */
    message_id?: number | string;
};

/**
 * The tools a bot replies in chat with: its own (memory, instructions),
 * start_task for longer work, search_computers to find what's on its
 * computers, and for the coordinator delegate_task and assign_computer
 * (which computers each crew member can use). Anything
 * else on a computer goes through a task, never mid-reply.
 */
export default async function grabBotChatTools({
    bot,
    user_id,
    computers,
    message_id,
}: Params): Promise<HarnessTool[]> {
    const bot_id = bot.id || 0;
    const tools = [
        ...grabBotTools({ user_id, bot_id }),
        startTaskTool({
            user_id,
            bot_id,
            computers,
            message_id,
        }),
        ...(computers.length ? [searchComputersTool({ bot_id, computers })] : []),
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
                coordinator_id: bot_id,
                coordinator_name: bot.name || "The coordinator",
                workers,
            }),
        );

        if (computers.length) {
            const access = Object.fromEntries(
                await Promise.all(
                    workers.map(async (worker) => [
                        worker.id || 0,
                        await grabBotComputers({ bot_id: worker.id || 0, user_id }),
                    ]),
                ),
            );

            tools.push(assignComputerTool({ user_id, workers, computers, access }));
        }
    }

    return tools;
}
