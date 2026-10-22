import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import type { HarnessTool } from "../../types";
import askToTakeOverTool from "../computer/ask-to-take-over-tool";
import searchComputersTool from "../computer/search-computers-tool";
import addBotToWorkspaceTool from "./add-bot-to-workspace-tool";
import assignComputerTool from "./assign-computer-tool";
import createBotTool from "./create-bot-tool";
import createWorkspaceTool from "./create-workspace-tool";
import delegateTaskTool from "./delegate-task-tool";
import deleteBotTool from "./delete-bot-tool";
import deleteWorkspaceTool from "./delete-workspace-tool";
import findBotTool from "./find-bot-tool";
import findWorkspaceTool from "./find-workspace-tool";
import grabBotTools from "./grab-bot-tools";
import removeBotFromWorkspaceTool from "./remove-bot-from-workspace-tool";
import updateBotTool from "./update-bot-tool";
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
 * for the coordinator (the super admin's alone) create_workspace and
 * update_workspace (a workspace and its shared context), create_bot to
 * grow the crew, delegate_task to every worker (the workspace's in a
 * workspace) plus, in its own chat, find_bot and find_workspace,
 * add_bot_to_workspace and remove_bot_from_workspace, assign_computer,
 * update_bot, delete_bot and delete_workspace (which workspace, which
 * computers, and which name, role and core instructions each crew member
 * gets, and what goes) or, in a workspace,
 * set_bot_workspace_instructions. Anything else on a computer goes through
 * a task, never mid-reply.
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
        ...(await grabBotTools({
            user_id,
            bot_id,
            workspace_id,
            computers,
            session_id,
            is_coordinator: bot.kind == "coordinator",
        })),
        startTaskTool({
            user_id,
            bot_id,
            session_id,
            computers,
            message_id,
        }),
        ...(computers.length
            ? [
                  searchComputersTool({ bot_id, computers, workspace_id }),
                  askToTakeOverTool({ computers, onAsk: (params) => onTakeOver?.(params) }),
              ]
            : []),
    ];

    if (bot.kind != "coordinator") return tools;

    const workspaces = (await grabUserWorkspaces({ user_id })).filter((w) => !w.archived);

    tools.push(createWorkspaceTool({ user_id, workspaces }));

    if (workspaces.length) {
        tools.push(updateWorkspaceTool({ user_id, workspaces, workspace_id }));
    }

    tools.push(createBotTool({ user_id, workspaces, workspace_id }));

    const workers = await grabCrewWorkers({ workspace_id });

    if (workspace_id) {
        if (!workers.length) return tools;

        tools.push(delegateTaskTool({
            user_id,
            coordinator_id: bot_id,
            session_id,
            workspace_id,
            coordinator_name: bot.name || "The coordinator",
            workers,
        }));
        tools.push(setWorkspaceInstructionsTool({ user_id, workspace_id, workers }));
        return tools;
    }

    tools.push(findBotTool(), findWorkspaceTool({ user_id }));

    if (workspaces.length) {
        tools.push(deleteWorkspaceTool({ user_id, workspaces }));
    }

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

    tools.push(updateBotTool({ user_id, workers }), deleteBotTool({ user_id, workers }));

    if (computers.length) {
        const access = Object.fromEntries(
            await Promise.all(
                workers.map(async (worker) => [
                    worker.id || 0,
                    await grabBotComputers({
                        bot_id: worker.id || 0,
                        include_workspace_computers: false,
                    }),
                ]),
            ),
        );

        tools.push(assignComputerTool({ user_id, workers, computers, access }));
    }

    if (workspaces.length) {
        tools.push(
            addBotToWorkspaceTool({ user_id, workers, workspaces }),
            removeBotFromWorkspaceTool({ user_id, workers, workspaces }),
        );
    }

    return tools;
}
