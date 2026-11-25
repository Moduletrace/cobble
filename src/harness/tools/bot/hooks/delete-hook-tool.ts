import { z } from "zod";
import deleteBotHook from "@/src/functions/backend/db/bot-hooks/delete-bot-hook";
import type { HarnessTool } from "../../../types";
import grabOwnHook from "./grab-own-hook";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The coordinator deletes any of the user's hooks, not only its own.
     */
    is_coordinator?: boolean;
    /**
     * The workspace the run is in: only a hook that runs there.
     */
    workspace_id?: number | string | null;
};

type Args = {
    hook_id: number;
};

/**
 * Lets a bot delete one of its hooks for good, or as the coordinator any of
 * the user's.
 */
export default function deleteHookTool({ user_id, bot_id, is_coordinator, workspace_id }: Params): HarnessTool<Args> {
    return {
        name: "delete_hook",
        description: `Delete ${
            is_coordinator ? "any of the user's hooks" : "one of your hooks"
        } for good (ids from list_hooks): its URL stops working and can't be brought back, and whatever calls it gets refused. Only when the user asks for it; to stop it for a while, pause_hook instead.`,
        schema: z.object({
            hook_id: z.number().int().positive(),
        }),
        run: async ({ args }) => {
            const hook = await grabOwnHook({ user_id, bot_id, hook_id: args.hook_id, is_coordinator, workspace_id });

            await deleteBotHook({ user_id, hook_id: hook.id! });

            return `Hook #${hook.id} "${hook.title}" deleted.`;
        },
    };
}