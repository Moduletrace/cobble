import { AppData } from "@/src/data/app-data";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabKnowledgebaseDocumentRow from "@/src/functions/backend/db/knowledgebases/grab-knowledgebase-document-row";
import grabKnowledgebaseDocumentText from "@/src/functions/backend/db/knowledgebases/grab-knowledgebase-document-text";
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
 * Super admins and admins: a document's title and text, what was written in
 * or what its file holds, loaded when it's opened to read or edit. Its
 * first `AppData.KnowledgebaseTextMaxChars` characters, `truncated` when
 * there are more.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<{
        document_id: number;
        name: string;
        source: "file" | "text";
        content: string;
        truncated: boolean;
    }>
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
        const text = await grabKnowledgebaseDocumentText({ document });
        const cap = AppData.KnowledgebaseTextMaxChars;

        return {
            success: true,
            singleRes: {
                document_id: document.id,
                name: document.name || "",
                source: document.source == "text" ? "text" : "file",
                content: text.slice(0, cap),
                truncated: text.length > cap,
            },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
