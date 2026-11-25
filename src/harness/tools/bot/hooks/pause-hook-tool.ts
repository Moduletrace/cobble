import { z } from "zod";
import updateBotHook from "@/src/functions/backend/db/bot-hooks/update-bot-hook";
import describeBotHook from "@/src/utils/describe-bot-hook";
import type { HarnessTool } from "../../../types";
import grabOwnHook from "./grab-own-hook";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The coordinator pauses any of the user's hooks, not only its own.
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
 * Lets a bot pause one of its hooks: calls are refused until it's on
 * again. Only taking away needs no confirming; switching it back on is a
 * proposal (`propose_hook`).
 */
export default function pauseHookTool({ user_id, bot_id, is_coordinator, workspace_id }: Params): HarnessTool<Args> {
    return {
        name: "pause_hook",
        description: `Pause ${
            is_coordinator ? "any of the user's hooks" : "one of your hooks"
        } (ids from list_hooks): calls to it are refused until it's switched back on. Use it when the user asks, or when a hook keeps sending work that fails or that the user doesn't want. Switching it back on needs the user's confirmation: propose it with propose_hook (hook_id, enabled true).`,
        schema: z.object({
            hook_id: z.number().int().positive(),
        }),
        run: async ({ args }) => {
            const hook = await grabOwnHook({ user_id, bot_id, hook_id: args.hook_id, is_coordinator, workspace_id });

            if (!hook.enabled) return `Hook #${hook.id} "${hook.title}" is already paused.`;

            const paused = await updateBotHook({ user_id, hook_id: hook.id!, data: { enabled: false } });

            if (paused.enabled) throw new Error(`Hook #${hook.id} is still on: pausing it didn't take.`);

            return `Hook paused: ${describeBotHook({
                hook: paused,
                owner: is_coordinator ? paused.bot_name || undefined : undefined,
            })}.`;
        },
    };
}