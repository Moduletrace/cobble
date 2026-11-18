import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import listKnowledgebaseDocuments from "@/src/functions/backend/db/knowledgebases/list-knowledgebase-documents";
import recordKnowledgebaseFile, {
    knowledgebaseFileProblem,
} from "@/src/functions/backend/db/knowledgebases/record-knowledgebase-file";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { UploadKnowledgebaseDocumentRequestSchema } from "@/src/schemas/knowledgebase-schema";
import type { KnowledgebaseDocumentsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: adds one file to a knowledgebase. Only documents whose
 * text can be read are taken (PDF, DOCX, markdown, plain text and the
 * like); the bytes are kept in private media and the document is queued to
 * be chunked and embedded (`recordKnowledgebaseFile`, shared with the
 * coordinator's tool).
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

        const { knowledgebase_id, name, data_url } = parseWithSchema({
            schema: UploadKnowledgebaseDocumentRequestSchema,
            data: body,
        });

        const mime = data_url.match(/^data:([^;,]*)/)?.[1] || "";
        const problem = knowledgebaseFileProblem({ name, mime_type: mime });

        if (problem) throw new AppError(problem);

        const { buffer } = await bufferFromBase64(data_url);

        const document_id = await recordKnowledgebaseFile({
            user_id: user.id,
            knowledgebase_id,
            name,
            data: buffer,
            mime_type: mime,
        });

        await logEvent({
            title: "Knowledgebase document added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} added ${name} (#${document_id}) to the knowledgebase #${knowledgebase_id}.`,
            metadata: { knowledgebase_id, document_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Added ${name}. It's searchable once it's read.`,
            singleRes: await listKnowledgebaseDocuments({ knowledgebase_id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};