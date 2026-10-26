import userAuth from "@/src/functions/backend/auth/user-auth";
import listKnowledgebaseDocuments from "@/src/functions/backend/db/knowledgebases/list-knowledgebase-documents";
import { KnowledgebaseIdRequestSchema } from "@/src/schemas/knowledgebase-schema";
import type { KnowledgebaseDocumentsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admins and admins: a knowledgebase's documents, loaded when its
 * documents are opened on the settings page.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<KnowledgebaseDocumentsPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (!canManageCrew({ user_types })) {
            throw new AppError(`Only an admin can do that.`);
        }

        const { knowledgebase_id } = parseWithSchema({ schema: KnowledgebaseIdRequestSchema, data: body });

        return { success: true, singleRes: await listKnowledgebaseDocuments({ knowledgebase_id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
