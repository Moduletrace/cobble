import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import type { HarnessTool } from "../../types";
import askToTakeOverTool from "../computer/ask-to-take-over-tool";
import searchComputersTool from "../computer/search-computers-tool";
import addBotToWorkspaceTool from "./add-bot-to-workspace-tool";
import assignComputerTool from "./assign-computer-tool";
import createBotTool from "./create-bot-tool";
import delegateTaskTool from "./delegate-task-tool";
import grabBotTools from "./grab-bot-tools";
import updateWorkspaceTool from "./update-workspace-tool";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import setWorkspaceInstructionsTool from "./set-workspace-instructions-tool";
import startTaskTool from "./start-task-tool";

type Params = {
    bot: BUN_SQLITE_COBBLE_BOTS;
    user_id: number | string;
    /**
     * The bot's computers where it runs, the current one first
     * (`grabBotComputers`).
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * The session being answered; tasks report back to it.
     */
    session_id: number | string;
    /**
     * The session's workspace, if any.
     */
    workspace_id?: number | string | null;
    /**
     * The user message being answered.
     */
    message_id?: number | string;
    /**
     * Called when the bot asks the user to take over a computer.
     */
    onTakeOver?: (params: { ref: string }) => void;
};

/**
 * The tools a bot replies in chat with: its own (memory, instructions, and
 * in a workspace switching its default computer), start_task for longer
 * work, search_computers to find what's on its computers,
 * ask_user_to_take_over when only the user can do something on one, and
 * for the coordinator (the super admin's alone) create_bot to grow the
 * crew, delegate_task to every worker (the workspace's in a workspace)
 * plus, in its own chat, add_bot_to_workspace and assign_computer (which
 * workspace and which computers each crew member gets) or, in a
 * workspace, set_bot_workspace_instructions. Anything else on a computer
 * goes through a task, never mid-reply.
 */
export default async function grabBotChatTools({
    bot,
    user_id,
    computers,
    session_id,
    workspace_id,
    message_id,
    onTakeOver,
}: Params): Promise<HarnessTool[]> {
    const bot_id = bot.id || 0;
    const tools = [
        ...grabBotTools({ user_id, bot_id, workspace_id, computers }),
        startTaskTool({
            user_id,
            bot_id,
            session_id,
            computers,
            message_id,
        }),
        ...(computers.length
            ? [
                  searchComputersTool({ computers, workspace_id }),
                  askToTakeOverTool({ computers, onAsk: (params) => onTakeOver?.(params) }),
              ]
            : []),
    ];

    if (bot.kind != "coordinator") return tools;

    const workspaces = (await grabUserWorkspaces({ user_id })).filter((w) => !w.archived);

    if (workspaces.length) {
        tools.push(updateWorkspaceTool({ user_id, workspaces, workspace_id }));
    }

    tools.push(createBotTool({ user_id, workspaces, workspace_id }));

    const workers =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
                sql: workspace_id
                    ? `SELECT b.* FROM bots b JOIN workspace_bots wb ON wb.bot_id = b.id AND wb.workspace_id = ?
                        WHERE b.kind = 'worker' ORDER BY b.id ASC`
                    : `SELECT * FROM bots WHERE kind = 'worker' ORDER BY id ASC`,
                values: workspace_id ? [workspace_id] : [],
            })
        ).payload || [];

    if (!workers.length) return tools;

    tools.push(
        delegateTaskTool({
            user_id,
            coordinator_id: bot_id,
            session_id,
            workspace_id,
            coordinator_name: bot.name || "The coordinator",
            workers,
        }),
    );

    if (workspace_id) {
        tools.push(setWorkspaceInstructionsTool({ user_id, workspace_id, workers }));
        return tools;
    }

    if (computers.length) {
        const access = Object.fromEntries(
            await Promise.all(
                workers.map(async (worker) => [
                    worker.id || 0,
                    await grabBotComputers({ bot_id: worker.id || 0 }),
                ]),
            ),
        );

        tools.push(assignComputerTool({ user_id, workers, computers, access }));
    }

    if (workspaces.length) {
        tools.push(addBotToWorkspaceTool({ user_id, workers, workspaces }));
    }

    return tools;
}
