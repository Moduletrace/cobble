import type { HarnessTool } from "../../types";
import updateInstructionsTool from "./update-instructions-tool";
import updateMemoryTool from "./update-memory-tool";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

/**
 * The tools a bot works with, bound to that bot. Computer, delegation and
 * media tools join this list as they are built.
 */
export default function grabBotTools({ user_id, bot_id }: Params): HarnessTool[] {
    return [
        updateMemoryTool({ user_id, bot_id }),
        updateInstructionsTool({ user_id, bot_id }),
    ];
}
