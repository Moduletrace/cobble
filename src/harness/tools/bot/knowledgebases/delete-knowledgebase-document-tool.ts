import { z } from "zod";
import deleteKnowledgebaseDocument from "@/src/functions/backend/db/knowledgebases/delete-knowledgebase-document";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "../extensions/assert-super-admin-run";

type Params = {
    user_id: number | string;
    attended: boolean;
};

type Args = {
    document_id: number;
};

/**
 * Deletes one document and everything read from it. Kept for documents
 * that are wrong, replaced or stale; a document read by another embedding
 * model is re-indexed, not deleted.
 */
export default function deleteKnowledgebaseDocumentTool({ user_id, attended }: Params): HarnessTool<Args> {
    return {
        name: "delete_knowledgebase_document",
        description: `Delete one document from a knowledgebase, with everything read from it, so no bot finds it again. Give the document id from list_knowledgebases. Documents read by another embedding model than the install's are re-indexed (reindex_knowledgebase), never deleted for that.`,
        schema: z.object({
            document_id: z.number().int().positive(),
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            if (!attended) throw new Error(`Knowledgebases are only changed in a reply or a task the user follows.`);

            const document = await deleteKnowledgebaseDocument({ document_id: args.document_id });

            await logEvent({
                title: "Knowledgebase document deleted",
                category: "system",
                user_id: Number(user_id),
                plain_text: `Deleted ${document.name} (#${document.id}) from knowledgebase #${document.knowledgebase_id}.`,
                metadata: { knowledgebase_id: document.knowledgebase_id, document_id: document.id },
            });

            return `Deleted ${document.name} (#${document.id}) from knowledgebase #${document.knowledgebase_id}. No bot finds it now.`;
        },
    };
}