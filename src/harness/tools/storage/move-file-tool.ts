import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import moveBotFile from "@/src/functions/backend/db/bot-files/move-bot-file";
import type { HarnessTool } from "../../types";
import { fileRef, type StorageToolContext } from "./storage-tool-context";

type Args = {
    file_id: number;
    path: string;
};

/**
 * Renames or moves a file into another folder, inside its own directory.
 */
export default function moveFileTool(context: StorageToolContext): HarnessTool<Args> {
    return {
        name: "move_file",
        description: `Rename a file or move it into another folder, by its ref id. The new path stays inside the same directory (yours, or the workspace's).`,
        schema: z.object({
            file_id: z.number().int().positive(),
            path: z
                .string()
                .min(1)
                .max(AppData.BotFilePathMaxChars)
                .describe(`The new path, e.g. "archive/q3.md"`),
        }),
        run: async ({ args }) => {
            const file = await moveBotFile({
                scopes: context.scopes,
                file_id: args.file_id,
                path: args.path,
            });

            return `Moved to ${file.path}. ${fileRef({ file_id: file.id! })}`;
        },
    };
}
