import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import listKnowledgebaseDocuments from "@/src/functions/backend/db/knowledgebases/list-knowledgebase-documents";
import recordKnowledgebaseDocument from "@/src/functions/backend/db/knowledgebases/record-knowledgebase-document";
import uploadAndRecordMedia from "@/src/functions/backend/db/users/media/upload-and-record-media";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import { AppData } from "@/src/data/app-data";
import { BotTextFileExtensions } from "@/src/dict/bot-file-dict";
import { UploadKnowledgebaseDocumentRequestSchema } from "@/src/schemas/knowledgebase-schema";
import type { KnowledgebaseDocumentsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import attachmentFileKind from "@/src/utils/attachment-file-kind";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import canExtractText from "@/src/utils/can-extract-text";
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
 * be chunked and embedded.
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

        if (!canExtractText({ name, mime_type: mime })) {
            throw new AppError(
                `${name} has no text to read. A knowledgebase takes ${BotTextFileExtensions.join(", ")} files.`,
            );
        }

        const { media_type, ext } = attachmentFileKind({ mime, name });
        const { buffer } = await bufferFromBase64(data_url);

        if (!buffer.length) {
            throw new AppError(`${name} is empty.`);
        }

        if (buffer.length > AppData.KnowledgebaseDocumentMaxBytes) {
            throw new AppError(
                `${name} is too big. Documents can be up to ${Math.round(AppData.KnowledgebaseDocumentMaxBytes / 1024 / 1024)} MB.`,
            );
        }

        const media = await uploadAndRecordMedia({
            data: buffer,
            media_type,
            media_mime_type: ext,
            media_paradigms: ["knowledgebase-document"],
            media: { title: name },
            extract_media_text_content: true,
            user: { id: Number(user.id) },
        }).catch(async (error) => {
            await logError({ title: `Knowledgebase document ${name} couldn't be saved`, error }).catch(() => {});
            throw new AppError(`Couldn't save ${name}.`);
        });

        if (!media.singleRes?.id) {
            throw new AppError(`Couldn't save ${name}.`);
        }

        const document_id = await recordKnowledgebaseDocument({
            user_id: user.id,
            knowledgebase_id,
            name,
            source: "file",
            media_id: media.singleRes.id,
            mime_type: mime,
            size: buffer.length,
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
