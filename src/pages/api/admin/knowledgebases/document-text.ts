import userAuth from "@/src/functions/backend/auth/user-auth";
import grabKnowledgebaseDocumentRow from "@/src/functions/backend/db/knowledgebases/grab-knowledgebase-document-row";
import { KnowledgebaseDocumentIdRequestSchema } from "@/src/schemas/knowledgebase-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admins and admins: a text document's title and content, loaded
 * when it's opened to read or edit.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<{ document_id: number; name: string; content: string }>
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

        const { document_id } = parseWithSchema({ schema: KnowledgebaseDocumentIdRequestSchema, data: body });
        const document = await grabKnowledgebaseDocumentRow({ document_id });

        if (document.source != "text") {
            throw new AppError(`Only a text document can be opened here.`);
        }

        return {
            success: true,
            singleRes: { document_id: document.id, name: document.name || "", content: document.content || "" },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
