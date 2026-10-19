import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import type { HarnessTool } from "../../types";
import createScheduleTool from "./create-schedule-tool";
import deleteScheduleTool from "./delete-schedule-tool";
import listSchedulesTool from "./list-schedules-tool";
import setWorkspaceComputerTool from "./set-workspace-computer-tool";
import updateScheduleTool from "./update-schedule-tool";
import updateInstructionsTool from "./update-instructions-tool";
import updateMemoryTool from "./update-memory-tool";
import reactToMessageTool from "./react-to-message-tool";

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
};

/**
 * The tools a bot works with on every run, bound to that bot and where it
 * works: its memory and instructions, its schedules, and in a workspace
 * with several computers switching the default one.
 */
export default function grabBotTools({
    user_id,
    bot_id,
    workspace_id,
    computers = [],
    session_id,
}: Params): HarnessTool[] {
    return [
        updateMemoryTool({ user_id, bot_id, workspace_id }),
        updateInstructionsTool({ user_id, bot_id, workspace_id }),
        createScheduleTool({ user_id, bot_id, workspace_id, computers }),
        listSchedulesTool({ user_id, bot_id }),
        updateScheduleTool({ user_id, bot_id }),
        deleteScheduleTool({ user_id, bot_id }),
        ...(session_id ? [reactToMessageTool({ bot_id, user_id, session_id })] : []),
        ...(workspace_id && computers.length > 1
            ? [setWorkspaceComputerTool({ user_id, workspace_id, computers })]
            : []),
    ];
}
