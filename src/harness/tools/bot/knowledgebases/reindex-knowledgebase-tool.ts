import { z } from "zod";
import grabKnowledgebase from "@/src/functions/backend/db/knowledgebases/grab-knowledgebase";
import reindexKnowledgebase from "@/src/functions/backend/db/knowledgebases/reindex-knowledgebase";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "../extensions/assert-super-admin-run";

type Params = {
    user_id: number | string;
    attended: boolean;
};

type Args = {
    knowledgebase_id: number;
};

/**
 * Reads every document of a knowledgebase again with the install's current
 * embedding model. The fix for documents searchable by words only, or read
 * by another model after Settings > Models changed; never a delete.
 */
export default function reindexKnowledgebaseTool({ user_id, attended }: Params): HarnessTool<Args> {
    return {
        name: "reindex_knowledgebase",
        description: `Read every document of a knowledgebase again with the install's current embedding model. That's what fixes documents marked searchable by words only or read by another embedding model after the model changed; nothing is lost, and each keeps its old passages until the new ones are in.`,
        schema: z.object({
            knowledgebase_id: z.number().int().positive(),
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            if (!attended) throw new Error(`Knowledgebases are only changed in a reply or a task the user follows.`);

            const knowledgebase = await grabKnowledgebase({ knowledgebase_id: args.knowledgebase_id });
            const count = await reindexKnowledgebase({ knowledgebase_id: knowledgebase.id });

            await logEvent({
                title: "Knowledgebase re-indexed",
                category: "system",
                user_id: Number(user_id),
                plain_text: `Queued ${count} documents of knowledgebase #${knowledgebase.id} (${knowledgebase.name}) to be read again.`,
                metadata: { knowledgebase_id: knowledgebase.id, documents: count },
            });

            return count
                ? `Queued ${count} documents of #${knowledgebase.id} ${knowledgebase.name} to be read again. They're searched as before until their new passages are in.`
                : `#${knowledgebase.id} ${knowledgebase.name} has no documents to read.`;
        },
    };
}