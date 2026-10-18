import type { BUN_SQLITE_BSQLITE_EMAILS } from "@/db/types/db";
import Input from "@moduletrace/twui/form/Input";
import Textarea from "@moduletrace/twui/form/Textarea";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import useFormInit from "@/src/hooks/use-form-init";
import type { Dispatch, SetStateAction } from "react";
import type { EmailAttachmentDraft } from "../../(utils)/email-attachment-draft";
import EmailFormAttachments from "./email-form-attachments";

type Props = ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_EMAILS>> & {
    attachments: EmailAttachmentDraft[];
    setAttachments: Dispatch<SetStateAction<EmailAttachmentDraft[]>>;
};

export default function EmailFormDetails({
    setForm,
    form,
    setStatus,
    attachments,
    setAttachments,
    app_context,
}: Props) {
    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Email Details</H3>

            <Row className="w-full grid xl:grid-cols-2">
                <Input
                    title="Title"
                    placeholder="Eg. AGM Notice Email"
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                        }));
                    }}
                    defaultValue={form.title}
                    showLabel
                />

                <Input
                    title="Email Subject"
                    placeholder="Eg. Notice of Annual General Meeting"
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            subject: e.target.value,
                        }));
                    }}
                    defaultValue={form.subject}
                    showLabel
                />
            </Row>

            <Textarea
                title="Recipients"
                placeholder={"Eg. resident@example.com\nSeparate multiple recipients with commas"}
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        to_emails: e.target.value,
                    }));
                }}
                defaultValue={form.to_emails}
                showLabel
                rows={2}
            />

            <EmailFormAttachments
                attachments={attachments}
                setAttachments={setAttachments}
                user_id={app_context?.user?.id}
                setStatus={setStatus}
            />
        </Stack>
    );
}