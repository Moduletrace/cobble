import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import listBotFiles from "@/src/functions/backend/db/bot-files/list-bot-files";
import folderRef from "@/src/utils/folder-ref";
import type { HarnessTool } from "../../types";
import { fileRef, formatBytes, type StorageToolContext } from "./storage-tool-context";

type Args = {
    folder?: string;
    search?: string;
    recursive?: boolean;
    scope?: string;
};

/**
 * Lists a bot's files: one folder's, or everything under it, or whatever
 * matches a name. Each file comes with its `[file:ID]` ref so the bot can
 * read it, and the answer names the folder it is in with a folder ref, so a
 * bot that points at "everything in reports/" writes something the user can
 * actually open.
 */
export default function listFilesTool(context: StorageToolContext): HarnessTool<Args> {
    return {
        name: "list_files",
        description: `List the files you have saved, newest first: one folder's with "folder", everything with "recursive", or the ones whose name or path has "search". Each line has its path, size and [file:ID] ref (e.g. [file:12]) to read it. The answer also names the folder as a folder ref, which opens it in Files without downloading anything: a file is a [file:ID] ref, a folder is a [folder:...] ref.`,
        schema: z.object({
            folder: z.string().max(AppData.BotFilePathMaxChars).optional(),
            search: z.string().max(120).optional(),
            recursive: z.boolean().optional(),
            scope: z
                .string()
                .optional()
                .describe(`"bot:<id>" or "workspace:<id>", to look in one of your directories only`),
        }),
        run: async ({ args }) => {
            const folder = args.folder?.trim() || "";

            const files = await listBotFiles({
                scopes: context.scopes,
                folder,
                recursive: args.recursive,
                search: args.search,
            });

            if (!files.length) {
                return folder
                    ? `Nothing in ${folder}.`
                    : `You have no files yet. Write one with write_file.`;
            }

            const lines = files.map((file) => {
                const where = file.scope == "workspace" ? ` (workspace ${file.owner_id})` : "";
                const ingested = file.ingested_at ? "" : " - not searchable yet";

                return `- ${file.path} - ${formatBytes({ bytes: Number(file.size) || 0 })}${where}${ingested} ${fileRef({ file_id: file.id! })}`;
            });

            const more =
                files.length >= AppData.BotFileListMaxItems
                    ? `\n(Showing the first ${AppData.BotFileListMaxItems}. Narrow it with "folder" or "search".)`
                    : "";

            return `${files.length} file(s):\n${lines.join("\n")}${more}\n\nThe folder: ${folderRefFor({ files, folder, scopes: context.scopes })}`;
        },
    };
}

/**
 * The folder the listing is about, as a folder ref the bot can put in a
 * message: the one it asked for, else the one the first file is in. Its
 * volume is the scope the file lives in.
 */
function folderRefFor({
    files,
    folder,
    scopes,
}: {
    files: { scope?: string | null; owner_id?: number | string | null; folder?: string | null }[];
    folder: string;
    scopes: StorageToolContext["scopes"];
}) {
    const first = files[0];
    const scope = first
        ? scopes.find((it) => it.scope == first.scope && Number(it.owner_id) == Number(first.owner_id))
        : scopes[0];
    const path = folder || first?.folder || "";
    const volume = scope?.scope == "workspace" ? "workspace" : "bot";

    return folderRef({ volume, owner_id: scope?.owner_id || 0, path });
}
