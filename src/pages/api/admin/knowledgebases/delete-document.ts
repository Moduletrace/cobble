import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import deleteKnowledgebaseDocument from "@/src/functions/backend/db/knowledgebases/delete-knowledgebase-document";
import listKnowledgebaseDocuments from "@/src/functions/backend/db/knowledgebases/list-knowledgebase-documents";
import { touchKnowledgebase } from "@/src/functions/backend/db/knowledgebases/record-knowledgebase-document";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { KnowledgebaseDocumentIdRequestSchema } from "@/src/schemas/knowledgebase-schema";
import type { KnowledgebaseDocumentsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: deletes one document from a knowledgebase. Bots stop
 * finding it at once.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<KnowledgebaseDocumentsPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const { document_id } = parseWithSchema({ schema: KnowledgebaseDocumentIdRequestSchema, data: body });
        const document = await deleteKnowledgebaseDocument({ document_id });
        const knowledgebase_id = Number(document.knowledgebase_id);

        await touchKnowledgebase({ knowledgebase_id });

        await logEvent({
            title: "Knowledgebase document deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted ${document.name} (#${document.id}) from the knowledgebase #${knowledgebase_id}.`,
            metadata: { knowledgebase_id, document_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Deleted ${document.name}.`,
            singleRes: await listKnowledgebaseDocuments({ knowledgebase_id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
