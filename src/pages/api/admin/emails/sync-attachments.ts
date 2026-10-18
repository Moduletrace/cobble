import type {
    BUN_SQLITE_BSQLITE_EMAIL_ATTACHMENTS,
} from "@/db/types/db";
import deleteMedia from "@/src/functions/backend/db/media/delete-media";
import userAuth from "@/src/functions/backend/auth/user-auth";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import type { ApiReqParams, TableType } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import BunSQLite from "@moduletrace/bun-sqlite";

export type EmailAttachmentDraft = {
    type: "letter" | "invoice" | "quote" | "file";
    letter_id?: number;
    invoice_id?: number;
    quote_id?: number;
    media_id?: number;
    file_name?: string;
    mime_type?: string;
};

export const handler: BunextAPIRouteHandler<APIResponseObject> = async (
    params,
) => {
    try {
        const body = params.body as ApiReqParams;

        const { user, user_types } = await userAuth({ req: params.req });

        if (!user?.logged_in_status) {
            return {
                success: false,
                msg: `Unauthorized`,
                logoutUser: true,
            };
        }

        const access = checkUserAccess({
            user_types,
            includes: ["admin"],
        });

        if (!access.success) {
            return access;
        }

        const email_id = body.email_id;
        const attachments: EmailAttachmentDraft[] =
            (
                body as ApiReqParams & {
                    attachments?: EmailAttachmentDraft[];
                }
            ).attachments || [];

        if (!email_id) {
            throw new Error(`Email not found`);
        }

        const existing_res = await BunSQLite.select<BUN_SQLITE_BSQLITE_EMAIL_ATTACHMENTS>({
            table: "email_attachments",
            query: {
                query: { email_id: { value: email_id } },
            },
        });

        const existing = existing_res.payload || [];

        const new_file_media_ids = attachments
            .filter((a) => a.type == "file" && a.media_id)
            .map((a) => Number(a.media_id));

        for (const existing_attachment of existing) {
            if (
                existing_attachment.type == "file" &&
                existing_attachment.media_id &&
                !new_file_media_ids.includes(
                    Number(existing_attachment.media_id),
                )
            ) {
                await deleteMedia({
                    ids: [existing_attachment.media_id],
                    can_delete_all_media: true,
                });
            }
        }

        await BunSQLite.delete({
            table: "email_attachments",
            query: {
                query: { email_id: { value: email_id } },
            },
        });

        if (attachments[0]) {
            const insert_data = attachments.map((attachment) => ({
                email_id: Number(email_id),
                type: attachment.type,
                letter_id:
                    attachment.type == "letter" ? attachment.letter_id : undefined,
                invoice_id:
                    attachment.type == "invoice"
                        ? attachment.invoice_id
                        : undefined,
                quote_id:
                    attachment.type == "quote" ? attachment.quote_id : undefined,
                media_id:
                    attachment.type == "file" ? attachment.media_id : undefined,
                file_name: attachment.file_name,
                mime_type: attachment.mime_type,
            }));

            const insert_res = await BunSQLite.insert<BUN_SQLITE_BSQLITE_EMAIL_ATTACHMENTS, TableType>({
                table: "email_attachments",
                data: insert_data,
            });

            if (!insert_res.success) {
                throw new Error(insert_res.msg || `Couldn't save attachments`);
            }
        }

        return {
            success: true,
            msg: `Attachments saved`,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};