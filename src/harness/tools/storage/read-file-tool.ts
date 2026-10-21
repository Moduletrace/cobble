import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import grabBotFile from "@/src/functions/backend/db/bot-files/grab-bot-file";
import grabDirNames from "@/src/utils/grab-dir-names";
import readMedia from "@/src/harness/media/read-media";
import type { HarnessTool } from "../../types";
import { fileRef, type StorageToolContext } from "./storage-tool-context";

type Args = {
    file_id?: number;
    path?: string;
    offset?: number;
    scope?: string;
};

const TextExtensions = [
    "txt",
    "md",
    "markdown",
    "csv",
    "json",
    "html",
    "htm",
    "xml",
    "yml",
    "yaml",
    "log",
    "tsv",
];

/**
 * Reads one of the bot's files: text as it is (a window at a time when it
 * is long), an image or audio through the media harness, and a PDF or DOCX
 * through the text extractor.
 */
export default function readFileTool(context: StorageToolContext): HarnessTool<Args> {
    return {
        name: "read_file",
        description: `Read a file you saved, by its ref id or its path. Text comes back in a window of about ${Math.round(AppData.BotFileReadMaxChars / 1000)}k characters; use "offset" for the next part. Images and audio are read for you, and PDFs and Word documents are turned into text.`,
        schema: z.object({
            file_id: z.number().int().positive().optional(),
            path: z.string().max(AppData.BotFilePathMaxChars).optional(),
            offset: z.number().int().min(0).optional(),
            scope: z.string().optional().describe(`"bot:<id>" or "workspace:<id>", with "path"`),
        }),
        run: async ({ args }) => {
            const [scope_name, owner] = (args.scope || "").split(":");

            const file = await grabBotFile({
                scopes: context.scopes,
                file_id: args.file_id,
                scope: scope_name,
                owner_id: owner,
                path: args.path,
            });

            if (!file?.id || !file.media?.media_write_path) {
                return `No file matches that. Use list_files to see what you have.`;
            }

            const { DATA_DIR } = grabDirNames();
            const absolute = `${DATA_DIR}/${file.media.media_write_path}`;
            const ext = (file.name || "").split(".").pop()?.toLowerCase() || "";

            if (TextExtensions.includes(ext)) {
                const text = await Bun.file(absolute).text();
                const offset = args.offset || 0;
                const window = text.slice(offset, offset + AppData.BotFileReadMaxChars);
                const end = offset + window.length;

                return [
                    `${file.path} ${fileRef({ file_id: file.id })}`,
                    window,
                    end < text.length
                        ? `\n[Read ${offset}-${end} of ${text.length} characters. Call read_file with offset ${end} for the rest.]`
                        : "",
                ]
                    .filter(Boolean)
                    .join("\n\n");
            }

            const bytes = new Uint8Array(await Bun.file(absolute).arrayBuffer());

            const text = await readMedia({
                data: bytes,
                media_type: file.mime_type || "application/octet-stream",
                name: file.name || undefined,
                bot_id: context.bot_id,
                workspace_id: context.workspace_id,
            });

            return `${file.path} ${fileRef({ file_id: file.id })}\n\n${text.slice(0, AppData.BotFileReadMaxChars)}`;
        },
    };
}
