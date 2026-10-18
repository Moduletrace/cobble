import type { BUN_SQLITE_BSQLITE_EMAILS } from "@/db/types/db";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import adminCrudHandler from "@/src/functions/frontend/admin-crud-handler";
import type useFormInit from "@/src/hooks/use-form-init";
import type { EmailAttachmentDraft } from "../(utils)/email-attachment-draft";
import _ from "lodash";
import type { APIResponseObject } from "@moduletrace/bunext/types";

export default async function submitEmail({
    setLoading,
    setStatus,
    form,
    existing_full,
    clearLocalForm,
    attachments,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_EMAILS>> & {
    attachments: EmailAttachmentDraft[];
}) {
    try {
        if (!form.title?.trim() && !form.subject?.trim()) {
            throw new Error(`Please provide a title or subject`);
        }

        if (!form.to_emails?.trim()) {
            throw new Error(
                `Please provide a recipient email address`,
            );
        }

        const confirm_msg = existing_full?.id
            ? `Update this email?`
            : `Create new email draft?`;

        if (!window.confirm(confirm_msg)) {
            return;
        }

        const new_email_data = _.pick<
            BUN_SQLITE_BSQLITE_EMAILS,
            keyof BUN_SQLITE_BSQLITE_EMAILS
        >(form, [
            "title",
            "subject",
            "body_html",
            "to_emails",
        ]);

        if (existing_full?.id) {
            new_email_data.status = "draft";
            new_email_data.sent_at = undefined;
        }

        setLoading(true);

        const create_or_update_res = await adminCrudHandler({
            action: existing_full?.id ? "update" : "insert",
            table: "emails",
            insert_data: [new_email_data],
            update_data: new_email_data,
            id: existing_full?.id,
        });

        if (!create_or_update_res.success) {
            throw new Error(
                create_or_update_res.msg || "Email Save Failed",
            );
        }

        const email_id =
            create_or_update_res.singleRes?.id || existing_full?.id;

        if (email_id && (attachments[0] || existing_full?.id)) {
            const sync_res = await fetchApi<
                { email_id: number | string; attachments: EmailAttachmentDraft[] },
                APIResponseObject
            >(`/api/admin/emails/sync-attachments`, {
                method: "POST",
                body: {
                    email_id,
                    attachments,
                },
            });

            if (!sync_res.success) {
                throw new Error(
                    sync_res.msg || "Couldn't save attachments",
                );
            }
        }

        clearLocalForm();

        if (existing_full?.id) {
            window.location.reload();
        } else {
            window.location.pathname = "/admin/emails";
        }
    } catch (error: any) {
        setStatus({
            error: true,
            msg: error.message || "Email Form Error",
        });

        setLoading(false);
    }
}