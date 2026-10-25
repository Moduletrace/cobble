import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import type { HarnessTool } from "../../../types";
import deleteHookTool from "./delete-hook-tool";
import listHooksTool from "./list-hooks-tool";
import pauseHookTool from "./pause-hook-tool";
import proposeHookTool from "./propose-hook-tool";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id?: number | string;
    workspace_id?: number | string | null;
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * The run is a hook call: what started it came from outside, so it
     * gets no hook tools at all.
     */
    hooked?: boolean;
    /**
     * Called with each proposal's ref, so the reply carries its card. Only
     * a chat reply proposes: someone is there to confirm.
     */
    onPropose?: (params: { ref: string }) => void;
};

/**
 * A bot's tools for the user's hooks it runs: read them, pause or delete
 * one (that only takes away), and in a chat reply propose a new one or a
 * change (the user confirms it from a card; a new one's URL goes to them
 * alone). A hook call's own run gets none, so a caller's payload can never
 * reach them.
 */
export default function grabBotHookTools({
    user_id,
    bot_id,
    session_id,
    workspace_id,
    computers,
    hooked,
    onPropose,
}: Params): HarnessTool[] {
    if (hooked) return [];

    return [
        listHooksTool({ user_id, bot_id }),
        pauseHookTool({ user_id, bot_id }),
        deleteHookTool({ user_id, bot_id }),
        ...(session_id && onPropose
            ? [proposeHookTool({ user_id, bot_id, session_id, workspace_id, computers, onPropose })]
            : []),
    ];
}
