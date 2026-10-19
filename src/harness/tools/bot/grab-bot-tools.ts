import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import type { HarnessTool } from "../../types";
import setWorkspaceComputerTool from "./set-workspace-computer-tool";
import updateInstructionsTool from "./update-instructions-tool";
import updateMemoryTool from "./update-memory-tool";

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
};

/**
 * The tools a bot works with on every run, bound to that bot and where it
 * works.
 */
export default function grabBotTools({
    user_id,
    bot_id,
    workspace_id,
    computers = [],
}: Params): HarnessTool[] {
    return [
        updateMemoryTool({ user_id, bot_id, workspace_id }),
        updateInstructionsTool({ user_id, bot_id, workspace_id }),
        ...(workspace_id && computers.length > 1
            ? [setWorkspaceComputerTool({ user_id, workspace_id, computers })]
            : []),
    ];
}
