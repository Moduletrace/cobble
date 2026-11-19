import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabKnowledgebasesOverview from "@/src/functions/backend/db/knowledgebases/grab-knowledgebases-overview";
import listKnowledgebaseDocuments from "@/src/functions/backend/db/knowledgebases/list-knowledgebase-documents";
import retryFailedDocuments from "@/src/functions/backend/db/knowledgebases/retry-failed-documents";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { KnowledgebaseIdRequestSchema } from "@/src/schemas/knowledgebase-schema";
import type { KnowledgebaseDocumentsPayload, KnowledgebasesOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import { z } from "zod";

const RequestSchema = KnowledgebaseIdRequestSchema.extend({
    /**
     * Set when the documents list retries one document; the answer is then
     * that list. Left out, the knowledgebase's row retries every failed
     * document and the answer is the overview.
     */
    document_id: z.coerce.number().int().positive().optional(),
});

/**
 * Super admin only: reads again the documents whose last read failed.
 * Ones that already succeeded stay as they are.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<KnowledgebasesOverviewPayload | KnowledgebaseDocumentsPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const { knowledgebase_id, document_id } = parseWithSchema({ schema: RequestSchema, data: body });
        const queued = await retryFailedDocuments({ knowledgebase_id, document_id });

        await logEvent({
            title: "Knowledgebase failed documents retried",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} retried ${queued} failed ${queued == 1 ? "document" : "documents"} of the knowledgebase #${knowledgebase_id}.`,
            metadata: { knowledgebase_id, document_id, queued },
            ip_address: grabRequestIP(req),
        });

        const msg = queued
            ? `Reading ${queued} failed ${queued == 1 ? "document" : "documents"} again.`
            : "Nothing failed to read.";

        return {
            success: true,
            msg,
            singleRes: document_id
                ? await listKnowledgebaseDocuments({ knowledgebase_id })
                : await grabKnowledgebasesOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
