import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import ingestBotFile from "@/src/functions/backend/db/bot-files/ingest-bot-file";
import type { HarnessTool } from "../../types";
import type { StorageToolContext } from "./storage-tool-context";

type Args = {
    file_id: number;
    read_media?: boolean;
};

/**
 * Ingests a file again: reads its text, chunks it and embeds it, so a
 * changed or previously failed file is searchable. Images and audio are
 * only read when asked for, since that costs a model call.
 */
export default function ingestFileTool(_context: StorageToolContext): HarnessTool<Args> {
    return {
        name: "ingest_file",
        description: `Make one of your files searchable again (a course correction when search misses something you know is in it), by its ref id. Images and scans are only read when "read_media" is true.`,
        schema: z.object({
            file_id: z.number().int().positive(),
            read_media: z.boolean().optional(),
        }),
        run: async ({ args, signal }) => {
            const result = await ingestBotFile({
                file_id: args.file_id,
                read_media: args.read_media,
                signal,
            });

            switch (result.status) {
                case "ingested":
                    return `Ingested: ${result.chunks} passage(s), searchable now.`;
                case "unavailable":
                    return `Its text is stored and searchable by words, but no embedding model is set, so meaning search is off.`;
                case "skipped":
                    return `It's too large to read (over ${Math.round(AppData.IngestMaxBytes / (1024 * 1024))} MB).`;
                default:
                    return `It has no text to read.`;
            }
        },
    };
}
