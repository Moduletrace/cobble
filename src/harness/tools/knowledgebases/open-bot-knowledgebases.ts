import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { KnowledgebasesNote } from "@/src/data/harness-prompts";
import {
    ReadKnowledgebaseDocumentToolName,
    SearchKnowledgebaseToolName,
} from "@/src/dict/knowledgebase-dict";
import readKnowledgebaseDocument from "@/src/functions/backend/db/knowledgebases/read-knowledgebase-document";
import searchKnowledgebases from "@/src/functions/backend/db/knowledgebases/search-knowledgebases";
import type { KnowledgebaseRecord } from "@/src/types";
import knowledgebasePassageBlock from "@/src/utils/knowledgebase-passage-block";
import type { HarnessTool } from "../../types";

type Params = {
    /**
     * The knowledgebases the run reaches (`grabBotExtensions`).
     */
    knowledgebases: KnowledgebaseRecord[];
    /**
     * Names the run's other tools already use: they win.
     */
    taken?: string[];
};

export type OpenBotKnowledgebases = {
    tools: HarnessTool[];
    /**
     * For the system prompt: how to use them. Empty when the run has none.
     */
    note: string;
    /**
     * The enabled ones' ids, for retrieving passages ahead of a reply.
     */
    ids: number[];
};

/**
 * The knowledgebases a run has, as a search tool and a reader, both
 * limited to them. Their list (name and what each holds) is in the search
 * tool's description, so a bot knows when to reach for one.
 */
export default function openBotKnowledgebases({ knowledgebases, taken = [] }: Params): OpenBotKnowledgebases {
    const enabled = knowledgebases.filter((knowledgebase) => knowledgebase.enabled);

    if (!enabled.length || taken.includes(SearchKnowledgebaseToolName)) return { tools: [], note: "", ids: [] };

    const ids = enabled.map((knowledgebase) => knowledgebase.id);
    const names = new Map(enabled.map((knowledgebase) => [knowledgebase.id, knowledgebase.name]));
    const list = enabled
        .map((knowledgebase) => `- ${knowledgebase.id}: ${knowledgebase.name}${knowledgebase.description ? `: ${knowledgebase.description}` : ""}`)
        .join("\n");

    const search: HarnessTool<{ query: string; knowledgebase_id?: number; document_id?: number; limit?: number }> = {
        name: SearchKnowledgebaseToolName,
        description: `Searches your knowledgebases for the passages that answer "query" (by meaning, falling back to words). Leave knowledgebase_id out to search them all. Your knowledgebases (id: name: what it holds):\n${list}`,
        schema: z.object({
            query: z.string().trim().min(1).max(500),
            knowledgebase_id: z
                .number()
                .int()
                .positive()
                .optional()
                .describe(`Only this knowledgebase`),
            document_id: z.number().int().positive().optional().describe(`Only this document's passages`),
            limit: z.number().int().min(1).max(20).optional(),
        }),
        run: async ({ args, signal }) => {
            if (args.knowledgebase_id && !ids.includes(args.knowledgebase_id)) {
                throw new Error(`You have no knowledgebase ${args.knowledgebase_id}. Search one of: ${ids.join(", ")}.`);
            }

            const result = await searchKnowledgebases({
                knowledgebase_ids: args.knowledgebase_id ? [args.knowledgebase_id] : ids,
                query: args.query,
                document_id: args.document_id,
                limit: args.limit || AppData.RagTopChunks,
                signal,
            });

            if (!result.hits.length) return result.note;

            const passages = result.hits.map((hit) =>
                knowledgebasePassageBlock({
                    source: `${names.get(hit.knowledgebase_id) || "a knowledgebase"} / ${hit.document_name}`,
                    document_id: hit.document_id,
                    at: `passage ${hit.chunk_index}`,
                    text: hit.text,
                }),
            );

            return `${result.note}\n\n${passages.join("\n\n")}`;
        },
    };

    const read: HarnessTool<{ document_id: number; from_passage?: number; from_char?: number }> = {
        name: ReadKnowledgebaseDocumentToolName,
        description: `Reads a knowledgebase document's own text, when a passage alone isn't enough: from a passage a search returned ("from_passage"), from where the last read stopped ("from_char"), or from the top.`,
        schema: z.object({
            document_id: z.number().int().positive(),
            from_passage: z.number().int().min(0).optional(),
            from_char: z.number().int().min(0).optional(),
        }),
        run: async ({ args }) => {
            const document = await readKnowledgebaseDocument({
                knowledgebase_ids: ids,
                document_id: args.document_id,
                from_passage: args.from_passage,
                from_char: args.from_char,
                max_chars: AppData.KnowledgebaseReadMaxChars,
            });

            if (!document.text) return `${document.name} has no text from there (it's ${document.length} characters long).`;

            const block = knowledgebasePassageBlock({
                source: document.name,
                document_id: args.document_id,
                at: `characters ${document.start} to ${document.start + document.text.length} of ${document.length}`,
                text: document.text,
            });

            return document.next == null
                ? `${block}\n\n(End of ${document.name}.)`
                : `${block}\n\n(${document.name} goes on: read on with from_char ${document.next}.)`;
        },
    };

    return { tools: [search, read], note: KnowledgebasesNote, ids };
}
