import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import type { HarnessTool } from "../../types";
import grabBotHookTools from "./hooks/grab-bot-hook-tools";
import grabBotTaskTools from "./tasks/grab-bot-task-tools";
import createScheduleTool from "./create-schedule-tool";
import deleteScheduleTool from "./delete-schedule-tool";
import listSchedulesTool from "./list-schedules-tool";
import setWorkspaceComputerTool from "./set-workspace-computer-tool";
import updateScheduleTool from "./update-schedule-tool";
import updateInstructionsTool from "./update-instructions-tool";
import updateMemoryTool from "./update-memory-tool";
import reactToMessageTool from "./react-to-message-tool";
import setPictureTool from "./set-picture-tool";
import type { StorageScope } from "@/src/utils/storage-access";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The workspace the run is in: memory and instructions save there by
     * default, and the bot can switch its default computer.
     */
    workspace_id?: number | string | null;
    /**
     * The bot's computers where it runs, the current one first.
     */
    computers?: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * The session being answered, so the bot can react to its messages.
     */
    session_id?: number | string;
    /**
     * Whether the run is the coordinator, which reaches every task and can
     * add to any bot's or workspace's list.
     */
    is_coordinator?: boolean;
    /**
     * The workspaces the bot is admin of (`grabBotRunPowers`).
     */
    admin_workspace_ids?: number[];
    /**
     * The files the run reaches (`grabRunScopes`), for the picture it may
     * set from one.
     */
    scopes?: StorageScope[];
    /**
     * The run is a hook call, so it gets no hook tools.
     */
    hooked?: boolean;
    /**
     * In a chat reply: called with each hook proposal's ref, so the reply
     * carries its card. Without it the bot can't propose hooks.
     */
    onPropose?: (params: { ref: string }) => void;
};

/**
 * The tools a bot works with on every run, bound to that bot and where it
 * works: its memory and instructions, its schedules, its hooks
 * (`grabBotHookTools`), and in a workspace with several computers
 * switching the default one.
 */
export default async function grabBotTools({
    user_id,
    bot_id,
    workspace_id,
    computers = [],
    session_id,
    is_coordinator,
    admin_workspace_ids,
    scopes = [],
    hooked,
    onPropose,
}: Params): Promise<HarnessTool[]> {
    return [
        setPictureTool({ user_id, bot_id, scopes, is_coordinator }),
        updateMemoryTool({ user_id, bot_id, workspace_id }),
        updateInstructionsTool({ user_id, bot_id, workspace_id }),
        createScheduleTool({ user_id, bot_id, workspace_id, computers }),
        listSchedulesTool({ user_id, bot_id }),
        updateScheduleTool({ user_id, bot_id }),
        deleteScheduleTool({ user_id, bot_id }),
        ...grabBotHookTools({ user_id, bot_id, session_id, workspace_id, computers, hooked, onPropose }),
        ...(session_id ? [reactToMessageTool({ bot_id, user_id, session_id })] : []),
        ...(workspace_id && computers.length > 1
            ? [setWorkspaceComputerTool({ user_id, workspace_id, computers })]
            : []),
        ...(await grabBotTaskTools({
            user_id,
            bot_id,
            is_coordinator: Boolean(is_coordinator),
            admin_workspace_ids,
            workspace_id,
        })),
    ];
}
