import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import searchBotFiles from "@/src/functions/backend/db/bot-files/search-bot-files";
import type { HarnessTool } from "../../types";
import { fileRef, type StorageToolContext } from "./storage-tool-context";

type Args = {
    query: string;
    file_id?: number;
    limit?: number;
};

/**
 * Searches the bot's saved files by meaning (through the embedding
 * vectors), falling back to words, and returns the passages with their
 * file's ref so the bot can read more.
 */
export default function searchFilesTool(context: StorageToolContext): HarnessTool<Args> {
    return {
        name: "search_files",
        description: `Search the files you have saved (documents the user gave you and what you wrote) and get the passages that answer "query", with their file's ref. Search before saying you don't know something that may be in a file, and before writing a document from memory.`,
        schema: z.object({
            query: z.string().min(1).max(500),
            file_id: z.number().int().positive().optional().describe(`Only this file's passages`),
            limit: z.number().int().min(1).max(20).optional(),
        }),
        run: async ({ args, signal }) => {
            const result = await searchBotFiles({
                scopes: context.scopes,
                query: args.query,
                file_id: args.file_id,
                limit: args.limit || AppData.RagTopChunks,
                signal,
                bot_id: context.bot_id,
                workspace_id: context.workspace_id,
            });

            if (!result.hits.length) return result.note;

            const passages = result.hits.map((hit, index) => {
                const where = hit.scope == "workspace" ? ` (workspace ${hit.scope})` : "";

                return `## ${index + 1}. ${hit.name}${where} ${fileRef({ file_id: hit.file_id })}\n${hit.text.trim()}`;
            });

            return `${result.note}\n\n${passages.join("\n\n")}`;
        },
    };
}
