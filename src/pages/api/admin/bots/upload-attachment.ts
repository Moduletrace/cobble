import userAuth from "@/src/functions/backend/auth/user-auth";
import { logError } from "@/src/functions/backend/logger";
import mediaToAttachment from "@/src/functions/backend/db/bots/media-to-attachment";
import uploadAndRecordMedia from "@/src/functions/backend/db/users/media/upload-and-record-media";
import { AppData } from "@/src/data/app-data";
import { UploadBotAttachmentRequestSchema } from "@/src/schemas/bot-schema";
import type { BotMessageAttachment } from "@/src/types";
import AppError from "@/src/utils/app-error";
import attachmentFileKind from "@/src/utils/attachment-file-kind";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Stores one file for a chat message, private to the session user, before
 * the message is sent with its id. Images are resized; documents have
 * their text pulled out now, so bots can read them later.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<BotMessageAttachment>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const { data_url, name } = parseWithSchema({
            schema: UploadBotAttachmentRequestSchema,
            data: body,
        });

        const mime = data_url.match(/^data:([^;,]*)/)?.[1] || "";
        const { media_type, ext } = attachmentFileKind({ mime, name });
        const { buffer } = await bufferFromBase64(data_url);

        if (!buffer.length) {
            throw new AppError(`${name} is empty.`);
        }

        if (buffer.length > AppData.BotAttachmentMaxBytes) {
            throw new AppError(
                `${name} is too big. Files can be up to ${Math.round(AppData.BotAttachmentMaxBytes / 1024 / 1024)} MB.`,
            );
        }

        const res = await uploadAndRecordMedia({
            data: buffer,
            media_type,
            media_mime_type: ext,
            media_paradigms: ["bot-attachment"],
            media: { title: name },
            extract_media_text_content: media_type == "document",
            is_private: true,
            user: { id: Number(user.id) },
        }).catch(async (error) => {
            await logError({ title: `Attachment ${name} couldn't be saved`, error }).catch(() => {});
            throw new AppError(`Couldn't save ${name}. If it's an image, try another format.`);
        });

        if (!res.singleRes?.id) {
            throw new AppError(`Couldn't save ${name}.`);
        }

        return {
            success: true,
            singleRes: mediaToAttachment({ media: res.singleRes }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
