import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import updateBotSystemPrompt from "@/src/functions/backend/db/bots/update-bot-system-prompt";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

/**
 * Lets a bot rewrite its own core instructions as it adapts to the user.
 */
export default function updateInstructionsTool({
    user_id,
    bot_id,
}: Params): HarnessTool<{ instructions: string }> {
    return {
        name: "update_instructions",
        description: `Replace your core instructions with this full text (markdown): the start of your prompt, before any workspace or memory. Change them only to work better for this user, such as a new standing rule they gave you. Keep everything that still applies.`,
        schema: z.object({
            instructions: z.string().trim().min(1).max(AppData.PromptMaxLength),
        }),
        run: async ({ args }) => {
            await updateBotSystemPrompt({
                user_id,
                bot_id,
                system_prompt: args.instructions,
            });
            return `Instructions saved. They apply from your next run.`;
        },
    };
}
