import type {
    BUN_SQLITE_BSQLITE_EMAIL_ATTACHMENTS,
    BUN_SQLITE_BSQLITE_EMAILS,
    BUN_SQLITE_BSQLITE_LETTERS,
} from "@/db/types/db";
import CopyFromExistingSelect from "@/src/components/general/copy-from-existing-select";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import Tag from "@moduletrace/twui/elements/Tag";
import Form from "@moduletrace/twui/form/Form";
import adminCrudHandler from "@/src/functions/frontend/admin-crud-handler";
import useFormInit from "@/src/hooks/use-form-init";
import { useAdminCrudGet } from "@/src/hooks/use-admin-crud-get";
import { useEffect, useState } from "react";
import submitEmail from "../../(functions)/submit-email";
import type { EmailAttachmentDraft } from "../../(utils)/email-attachment-draft";
import EmailFormAction from "./email-form-action";
import EmailFormBody from "./email-form-body";
import EmailFormDetails from "./email-form-details";
import LoadingRectangleBlock from "@moduletrace/twui/layout/LoadingRectangleBlock";

type Props = {
    existing_email?: BUN_SQLITE_BSQLITE_EMAILS;
};

export default function EmailForm({ existing_email }: Props) {
    const init = useFormInit<BUN_SQLITE_BSQLITE_EMAILS>({
        existing: existing_email,
        existing_full: existing_email,
        title: "Email",
    });

    const { loading, status, ready, setForm } = init;

    const [attachments, setAttachments] = useState<EmailAttachmentDraft[]>([]);

    const is_existing = Boolean(existing_email?.id);

    const { res: attachment_rows } =
        useAdminCrudGet<BUN_SQLITE_BSQLITE_EMAIL_ATTACHMENTS>({
            table: "email_attachments",
            ready: is_existing ? undefined : false,
            sql_query: is_existing
                ? { query: { email_id: { value: existing_email?.id } } }
                : undefined,
        });

    useEffect(() => {
        if (attachment_rows === undefined) return;

        if (attachment_rows[0]) {
            if (attachments[0]) return;

            setAttachments(
                attachment_rows.map((row) => ({
                    type: row.type as "letter" | "invoice" | "file",
                    letter_id: row.letter_id
                        ? Number(row.letter_id)
                        : undefined,
                    invoice_id: row.invoice_id
                        ? Number(row.invoice_id)
                        : undefined,
                    media_id: row.media_id ? Number(row.media_id) : undefined,
                    file_name: row.file_name || undefined,
                    mime_type: row.mime_type || undefined,
                })),
            );

            return;
        }
    }, [attachment_rows]);

    useEffect(() => {
        if (!ready) return;
        if (existing_email?.id) return;

        const params = new URLSearchParams(window.location.search);
        const from_id = params.get("from");
        const from_letter_id = params.get("from_letter");

        if (!from_id && !from_letter_id) return;

        if (from_id) {
            adminCrudHandler<BUN_SQLITE_BSQLITE_EMAILS>({
                action: "get",
                table: "emails",
                id: from_id,
            }).then((res) => {
                const record = res.payload?.[0] || res.singleRes;

                if (record) {
                    setForm(record);
                }
            });
        }

        if (from_letter_id) {
            adminCrudHandler<BUN_SQLITE_BSQLITE_LETTERS>({
                action: "get",
                table: "letters",
                id: from_letter_id,
            }).then((res) => {
                const record = res.payload?.[0] || res.singleRes;

                if (record) {
                    setForm((prev) => ({
                        ...prev,
                        subject: prev.subject || record.subject,
                        title: prev.title || record.title,
                    }));

                    setAttachments((prev) =>
                        prev.some(
                            (a) =>
                                a.type == "letter" && a.letter_id == record.id,
                        )
                            ? prev
                            : [
                                  ...prev,
                                  {
                                      type: "letter",
                                      letter_id: record.id
                                          ? Number(record.id)
                                          : undefined,
                                  },
                              ],
                    );
                }
            });
        }
    }, [ready]);

    return (
        <>
            <Form
                className="w-full gap-6"
                onSubmit={() => {
                    submitEmail({ ...init, attachments });
                }}
            >
                {status?.error && <Tag color="error">{status.msg}</Tag>}
                {loading && <LoadingOverlay />}

                {!existing_email?.id ? (
                    <CopyFromExistingSelect
                        table="emails"
                        title="Copy from Existing Email"
                        onSelect={(record) => {
                            setForm(
                                record as BUN_SQLITE_BSQLITE_EMAILS,
                            );
                        }}
                    />
                ) : null}

                {ready ? (
                    <>
                        <EmailFormDetails
                            {...init}
                            attachments={attachments}
                            setAttachments={setAttachments}
                        />
                        <EmailFormBody {...init} />
                        <EmailFormAction {...init} />
                    </>
                ) : (
                    <LoadingRectangleBlock className="h-[700px]" />
                )}
            </Form>
        </>
    );
}
