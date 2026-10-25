import { z } from "zod";
import grabBotHooks from "@/src/functions/backend/db/bot-hooks/grab-bot-hooks";
import describeBotHook from "@/src/utils/describe-bot-hook";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

/**
 * Lets a bot see the user's hooks it runs, everywhere it works, never
 * their URLs.
 */
export default function listHooksTool({ user_id, bot_id }: Params): HarnessTool<Record<string, never>> {
    return {
        name: "list_hooks",
        description: `List the user's hooks that give you work: id, name, what calls it (an outside service at its secret URL, or browser notifications on a computer), where it runs, whether it's paused, its runs, last call and last error. To see what calls sent and what your runs answered, use search_hook_calls. You never see a hook's URL: only the user does.`,
        schema: z.object({}),
        run: async () => {
            const hooks = await grabBotHooks({ user_id, bot_id });

            if (!hooks.length) return `You have no hooks.`;

            return hooks.map((hook) => `- ${describeBotHook({ hook })}`).join("\n");
        },
    };
}
