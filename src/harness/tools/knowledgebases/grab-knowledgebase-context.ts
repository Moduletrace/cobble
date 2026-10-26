import { AppData } from "@/src/data/app-data";
import searchKnowledgebases from "@/src/functions/backend/db/knowledgebases/search-knowledgebases";
import type { KnowledgebaseRecord } from "@/src/types";
import knowledgebasePassageBlock from "@/src/utils/knowledgebase-passage-block";

type Params = {
    knowledgebases: KnowledgebaseRecord[];
    /**
     * The knowledgebases the run may search (`openBotKnowledgebases`).
     */
    ids: number[];
    /**
     * What the user just asked: the reply's unanswered messages.
     */
    query: string;
    signal?: AbortSignal;
};

/**
 * The passages a reply starts with: the knowledgebases searched for the
 * user's newest messages before the bot reads them, so a plain question
 * gets an answer from the documents without a tool call. Empty when
 * nothing matched or the search failed: the bot can still search itself.
 */
export default async function grabKnowledgebaseContext({ knowledgebases, ids, query, signal }: Params) {
    const text = query.trim().slice(0, 1000);

    if (!ids.length || text.length < 3) return "";

    const result = await searchKnowledgebases({
        knowledgebase_ids: ids,
        query: text,
        limit: AppData.KnowledgebaseAutoPassages,
        signal,
    }).catch(() => null);

    if (!result?.hits.length) return "";

    const names = new Map(knowledgebases.map((knowledgebase) => [knowledgebase.id, knowledgebase.name]));
    const passages = result.hits.map((hit) =>
        knowledgebasePassageBlock({
            source: `${names.get(hit.knowledgebase_id) || "a knowledgebase"} / ${hit.document_name}`,
            document_id: hit.document_id,
            at: `passage ${hit.chunk_index}`,
            text: hit.text,
        }),
    );

    return `# From your knowledgebases

The app searched your knowledgebases for the user's newest message and found these passages (${result.mode == "vector" ? "by meaning" : "by matching words"}). They may or may not be relevant; use the ones that are, say which document an answer came from, and search_knowledgebase for more.

${passages.join("\n\n")}`;
}
