import { z } from "zod";
import grabKnowledgebase from "@/src/functions/backend/db/knowledgebases/grab-knowledgebase";
import retryFailedDocuments from "@/src/functions/backend/db/knowledgebases/retry-failed-documents";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "../extensions/assert-super-admin-run";

type Params = {
    user_id: number | string;
    attended: boolean;
};

type Args = {
    knowledgebase_id: number;
    document_id?: number;
};

/**
 * Reads again the documents whose last read failed. The ones that already
 * succeeded are left as they are; reading every document again is
 * `reindex_knowledgebase`.
 */
export default function retryFailedDocumentsTool({ user_id, attended }: Params): HarnessTool<Args> {
    return {
        name: "retry_failed_documents",
        description: `Read again the documents of a knowledgebase whose last read failed (list_knowledgebases marks them failed). Documents that already succeeded are left as they are. With document_id, only that one, and only when it failed. Reading every document again, including the ones that succeeded, is reindex_knowledgebase.`,
        schema: z.object({
            knowledgebase_id: z.number().int().positive(),
            document_id: z.number().int().positive().optional(),
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            if (!attended) throw new Error(`Knowledgebases are only changed in a reply or a task the user follows.`);

            const knowledgebase = await grabKnowledgebase({ knowledgebase_id: args.knowledgebase_id });
            const count = await retryFailedDocuments({
                knowledgebase_id: knowledgebase.id,
                document_id: args.document_id,
            });

            await logEvent({
                title: "Knowledgebase failed documents retried",
                category: "system",
                user_id: Number(user_id),
                plain_text: `Queued ${count} failed documents of knowledgebase #${knowledgebase.id} (${knowledgebase.name}) to be read again.`,
                metadata: { knowledgebase_id: knowledgebase.id, document_id: args.document_id, documents: count },
            });

            if (!count) {
                return args.document_id
                    ? `#${args.document_id} didn't fail, so it wasn't read again.`
                    : `#${knowledgebase.id} ${knowledgebase.name} has no failed documents.`;
            }

            return `Queued ${count} failed ${count == 1 ? "document" : "documents"} of #${knowledgebase.id} ${knowledgebase.name} to be read again. The ones that already succeeded were left as they are.`;
        },
    };
}
