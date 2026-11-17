import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import statComputerFile from "@/src/functions/backend/computers/stat-computer-file";
import writeComputerFile from "@/src/functions/backend/computers/write-computer-file";
import grabBotFile from "@/src/functions/backend/db/bot-files/grab-bot-file";
import { resolveComputerPath, type ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import formatBytes from "@/src/utils/format-bytes";
import mediaFilePath from "@/src/utils/media-file-path";
import type { StorageScope } from "@/src/utils/storage-access";
import type { HarnessTool } from "../../types";
import computerWorkspaceRoomError from "./computer-workspace-room";

type Params = {
    computer: ComputerApi;
    dirs: ComputerRunDirs;
    /**
     * The files this run may read (`grabRunScopes`): a file outside them is
     * not its to export.
     */
    scopes: StorageScope[];
};

type Args = {
    file_id: number;
    path: string;
};

/**
 * Copies one of the bot's own files onto its computer: the inverse of
 * `import_file`, and the way back for a source a rebuild took with it.
 *
 * A bot given a file in the chat had it in its files only: app storage is
 * the copy that survives a rebuild, while the computer's workspace is a
 * mount a rebuild recreates empty. Without this, a run whose source was no
 * longer on the computer had no legal way to get it back, and one spent
 * thirty turns probing the container, then the user's own accounts, for a
 * copy of a file the app was holding all along.
 *
 * The bytes go over the agent's write endpoint, which takes them base64
 * encoded (`writeComputerFile`), so a binary source arrives whole.
 */
export default function exportFileTool({ computer, dirs, scopes }: Params): HarnessTool<Args> {
    const max = formatBytes({ bytes: AppData.BotFileExportMaxBytes });

    return {
        name: "export_file",
        description: `Copy one of your own files onto this computer, so you can work on it here. Give the file's ref id and where it goes in your folder (${dirs.cwd}); missing folders are created. Use it for a source the user gave you when it isn't on the computer any more (a rebuild takes everything outside your folders), instead of looking for it elsewhere or fetching it again through the browser. Up to ${max}.`,
        schema: z.object({
            file_id: z.number().int().positive().describe(`The file's id from its [file:ID] ref, or from list_files`),
            path: z
                .string()
                .min(1)
                .max(AppData.BotFilePathMaxChars)
                .describe(`Where to put it on the computer, relative to your folder, e.g. "sources/summit-canva-v1.png"`),
        }),
        run: async ({ args, signal }) => {
            const file = await grabBotFile({ scopes, file_id: args.file_id });
            const absolute = mediaFilePath({ write_path: file?.media?.media_write_path });

            if (!file?.id || !absolute) {
                return `No file matches that, or it has no bytes stored. Use list_files to see what you have.`;
            }

            const stored = Bun.file(absolute);

            if (!(await stored.exists())) {
                return `That file's copy is missing on the server (it may have been cleaned up since). Use list_files to see what you have.`;
            }

            const name = file.name || file.path || "file";

            /**
             * The size is checked before the read, so a file over the cap is
             * refused without loading it into memory.
             */
            if (stored.size > AppData.BotFileExportMaxBytes) {
                return `That file is ${formatBytes({ bytes: stored.size })}: export_file takes up to ${max}. For an image, transform_image can make a smaller copy to export instead.`;
            }

            const bytes = Buffer.from(await stored.arrayBuffer());

            const path = resolveComputerPath({ path: args.path, dirs });
            const existing = await statComputerFile({ computer, path, run_as: dirs.run_as, signal }).catch(() => null);
            const existing_bytes = existing?.exists && existing.type == "file" ? existing.size : 0;
            /**
             * Only what the copy adds counts against the workspace's limit,
             * as a rewrite does (`computer_write_file`): exporting over a
             * file the same size adds nothing.
             */
            const too_big = await computerWorkspaceRoomError({
                computer,
                dirs,
                incoming_bytes: Math.max(0, bytes.length - existing_bytes),
                signal,
            });

            if (too_big) return too_big;

            const written = await writeComputerFile({ computer, path, content: bytes, run_as: dirs.run_as, signal });

            return [
                `Copied ${name} (${formatBytes({ bytes: written.size })}) from your files to ${path}.`,
                existing_bytes
                    ? `It replaced the ${formatBytes({ bytes: existing_bytes })} file that was there.`
                    : `It is a new file there.`,
            ].join(" ");
        },
    };
}