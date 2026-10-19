import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import updateBotMemory from "@/src/functions/backend/db/bots/update-bot-memory";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

/**
 * Lets a bot rewrite its own memory (shown to it under `# Memory`).
 */
export default function updateMemoryTool({
    user_id,
    bot_id,
}: Params): HarnessTool<{ memory: string }> {
    return {
        name: "update_memory",
        description: `Replace your memory with this full text (markdown). It's in your prompt under "# Memory" on every run. Keep what you must always remember: the user's preferences, facts about their work, decisions made. Anything you leave out is forgotten, so include the parts that still matter.`,
        schema: z.object({
            memory: z.string().max(AppData.PromptMaxLength),
        }),
        run: async ({ args }) => {
            await updateBotMemory({ user_id, bot_id, memory: args.memory });
            return `Memory saved.`;
        },
    };
}
