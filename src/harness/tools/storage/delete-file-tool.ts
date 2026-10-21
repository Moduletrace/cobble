import { z } from "zod";
import deleteBotFile from "@/src/functions/backend/db/bot-files/delete-bot-file";
import type { HarnessTool } from "../../types";
import type { StorageToolContext } from "./storage-tool-context";

type Args = {
    file_id: number;
};

/**
 * Deletes a file the bot saved, with its searchable text. Its bytes go for
 * good, so a file the user may still want is moved, not deleted.
 */
export default function deleteFileTool(context: StorageToolContext): HarnessTool<Args> {
    return {
        name: "delete_file",
        description: `Delete one of your files for good, by its ref id. Use it to clear space, never for something the user still needs.`,
        schema: z.object({
            file_id: z.number().int().positive(),
        }),
        run: async ({ args }) => {
            const file = await deleteBotFile({ scopes: context.scopes, file_id: args.file_id });

            return `${file.path} is deleted.`;
        },
    };
}
