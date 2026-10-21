import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import type { BotFilePurpose } from "@/src/dict/bot-file-dict";
import enqueueFileIngest from "@/src/file-ingest/enqueue-file-ingest";
import recordBotFile from "@/src/functions/backend/db/bot-files/record-bot-file";
import type { HarnessTool } from "../../types";
import {
    describeScope,
    fileRef,
    findNamedScope,
    formatBytes,
    type StorageToolContext,
} from "./storage-tool-context";

type Args = {
    path: string;
    content: string;
    scope?: string;
    attach?: boolean;
    purpose?: BotFilePurpose;
};

/**
 * Writes a text file (markdown, CSV, JSON, code, plain text) into one of
 * the bot's directories, making folders as needed. The file stays for
 * later runs and becomes searchable.
 */
export default function writeFileTool(context: StorageToolContext): HarnessTool<Args> {
    const own = context.scopes[0];

    return {
        name: "write_file",
        description: `Save a text file for later: markdown, CSV, JSON, code or plain text. Give it a path like "reports/q3.md"; folders are made as needed. Files belong to ${
            own?.scope == "workspace" ? "the workspace you're working in" : "you"
        } and stay between runs: write a file before telling the user something is saved, and search_files to find one you wrote before. It is readable and searchable at once.${
            context.scopes.length > 1
                ? ` "scope" picks a directory: ${context.scopes.map((s) => `${s.scope}:${s.owner_id}`).join(", ")}.`
                : ""
        }`,
        schema: z.object({
            path: z
                .string()
                .min(1)
                .max(AppData.BotFilePathMaxChars)
                .describe(`Where it goes, e.g. "notes.md" or "reports/q3.md"`),
            content: z.string().max(AppData.BotFileWriteMaxChars),
            scope: z.string().optional().describe(`"bot:<id>" or "workspace:<id>"`),
            attach: z
                .boolean()
                .optional()
                .describe(`Also send it to the user with this reply, as an attachment`),
            purpose: z
                .enum(["writing", "artifact"])
                .optional()
                .describe(`"writing" for notes and text, "artifact" for a finished file the user asked for`),
        }),
        run: async ({ args }) => {
            const named = args.scope ? findNamedScope({ scopes: context.scopes, name: args.scope }) : own;

            if (!named) {
                return `You can't write there. Your directories: ${context.scopes
                    .map((s) => `${s.scope}:${s.owner_id}`)
                    .join(", ")}.`;
            }

            const file = await recordBotFile({
                bot_id: context.bot_id,
                scope: named.scope,
                owner_id: named.owner_id,
                path: args.path,
                data: args.content,
                purpose: args.purpose || "writing",
                source: "bot-write",
                user_id: context.user_id,
            });

            await enqueueFileIngest({ file_id: file.id! });

            if (args.attach && file.media_id) {
                context.onAttach?.({ media_id: Number(file.media_id), name: file.name || "" });
            }

            return [
                `Saved ${file.path} (${formatBytes({ bytes: Number(file.size) || 0 })}) in ${describeScope(named)}. ${fileRef({ file_id: file.id! })}`,
                "Tell the user the file's name and what's in it.",
            ].join("\n\n");
        },
    };
}
