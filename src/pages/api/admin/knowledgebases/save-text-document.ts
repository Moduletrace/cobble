import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import listKnowledgebaseDocuments from "@/src/functions/backend/db/knowledgebases/list-knowledgebase-documents";
import saveKnowledgebaseText from "@/src/functions/backend/db/knowledgebases/save-knowledgebase-text";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveKnowledgebaseTextRequestSchema } from "@/src/schemas/knowledgebase-schema";
import type { KnowledgebaseDocumentsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: writes a text document into a knowledgebase, or
 * changes one.
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

        const data = parseWithSchema({ schema: SaveKnowledgebaseTextRequestSchema, data: body });
        const document_id = await saveKnowledgebaseText({ user_id: user.id, data });

        await logEvent({
            title: data.document_id ? "Knowledgebase document changed" : "Knowledgebase document added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} ${data.document_id ? "changed" : "wrote"} ${data.name} (#${document_id}) in the knowledgebase #${data.knowledgebase_id}.`,
            metadata: { knowledgebase_id: data.knowledgebase_id, document_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved ${data.name}. It's searchable once it's read.`,
            singleRes: await listKnowledgebaseDocuments({ knowledgebase_id: data.knowledgebase_id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
