import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import copyBotFile from "@/src/functions/backend/db/bot-files/copy-bot-file";
import type { HarnessTool } from "../../types";
import { fileRef, findNamedScope, type StorageToolContext } from "./storage-tool-context";

type Args = {
    file_id: number;
    scope: string;
    path?: string;
};

/**
 * Copies a file into another of the bot's directories: the coordinator
 * bringing a worker's file into its own or into a workspace, or the other
 * way round. Only available when the run reaches more than one.
 */
export default function copyFileTool(context: StorageToolContext): HarnessTool<Args> {
    return {
        name: "copy_file",
        description: `Copy one of your files into another directory, by its ref id: ${context.scopes
            .map((s) => `${s.scope}:${s.owner_id}`)
            .join(", ")}. The copy is separate: deleting one leaves the other.`,
        schema: z.object({
            file_id: z.number().int().positive(),
            scope: z.string().describe(`Where the copy goes, e.g. "bot:2" or "workspace:1"`),
            path: z.string().max(AppData.BotFilePathMaxChars).optional(),
        }),
        run: async ({ args }) => {
            const target = findNamedScope({ scopes: context.scopes, name: args.scope });

            if (!target) {
                return `You can't write there. Your directories: ${context.scopes
                    .map((s) => `${s.scope}:${s.owner_id}`)
                    .join(", ")}.`;
            }

            const file = await copyBotFile({
                scopes: context.scopes,
                file_id: args.file_id,
                bot_id: context.bot_id,
                scope: target,
                path: args.path,
                user_id: context.user_id,
            });

            return `Copied to ${target.scope} ${target.owner_id} as ${file.path}. ${fileRef({ file_id: file.id! })}`;
        },
    };
}
