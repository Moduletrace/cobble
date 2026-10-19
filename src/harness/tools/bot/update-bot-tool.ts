import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { BotHue } from "@/src/dict/bot-dict";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import updateBot from "@/src/functions/backend/db/bots/update-bot";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The user's worker bots.
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
};

type Args = {
    bot_id: number;
    name?: string;
    role?: string;
    instructions?: string;
};

/**
 * Lets the coordinator change an existing crew member: its name, its
 * one-line job, and its core instructions (the start of its prompt in its
 * own chat and in every workspace). Its hue and picture stay as they are.
 * Workspace-only instructions have their own tool
 * (`set_bot_workspace_instructions`).
 */
export default function updateBotTool({ user_id, workers }: Params): HarnessTool<Args> {
    const crew = workers.map((bot) => `${bot.id}: ${bot.name}`).join("; ");

    return {
        name: "update_bot",
        description: `Change an existing crew member: name, the one-line role it's shown with, and/or its core instructions (markdown: what they do and how they work, the start of their prompt in their own chat and in every workspace). Only the fields you pass change. Instructions replace what they had, so keep what still applies, their own edits included. This is not their instructions for one workspace: use set_bot_workspace_instructions for that. Crew: ${crew || "none"}.`,
        schema: z
            .object({
                bot_id: z.number().int(),
                name: z.string().trim().min(1).max(40).optional(),
                role: z.string().trim().max(120).optional(),
                instructions: z.string().trim().min(1).max(AppData.PromptMaxLength).optional(),
            })
            .refine(
                (args) =>
                    args.name !== undefined ||
                    args.role !== undefined ||
                    args.instructions !== undefined,
                "Give the name, role or instructions to change.",
            ),
        run: async ({ args }) => {
            const fresh = await grabCrewWorkers();
            const worker = fresh.find((bot) => bot.id == args.bot_id);

            if (!worker?.id) {
                throw new Error(
                    `No crew member has id ${args.bot_id}. Crew: ${fresh
                        .map((bot) => `${bot.id}: ${bot.name}`)
                        .join("; ") || "none"}.`,
                );
            }

            const changed = [
                args.name !== undefined ? "name" : "",
                args.role !== undefined ? "role" : "",
                args.instructions !== undefined ? "core instructions" : "",
            ].filter(Boolean);

            const saved = await updateBot({
                user_id,
                bot_id: worker.id,
                name: args.name ?? worker.name ?? "Bot",
                role: args.role ?? worker.role ?? "",
                hue: (worker.hue || "ember") as BotHue,
                system_prompt: args.instructions ?? worker.system_prompt ?? "",
            });

            return `${saved.name}'s ${changed.join(", ")} saved.${args.instructions !== undefined ? " The instructions apply from its next run, in its own chat and in every workspace." : ""}`;
        },
    };
}
