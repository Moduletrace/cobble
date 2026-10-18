import type { BUN_SQLITE_BSQLITE_EMAILS } from "@/db/types/db";
import Tag from "@moduletrace/twui/elements/Tag";
import Divider from "@moduletrace/twui/layout/Divider";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { EmailAttachmentRecord } from "@/src/functions/backend/db/documents/grab-email-attachments";
import dayjs from "dayjs";
import EmailAttachmentRow from "./email-attachment-row";

type Props = {
    email: BUN_SQLITE_BSQLITE_EMAILS;
    attachments?: EmailAttachmentRecord[] | null;
};

export default function EmailDetails({
    email,
    attachments,
}: Props) {
    const status_title = email.status == "sent" ? "Sent" : "Draft";
    const date_created = dayjs(Number(email.created_at)).toString();
    const sent_date = email.sent_at
        ? dayjs(Number(email.sent_at)).toString()
        : null;

    return (
        <Stack className="w-full gap-4">
            <Row className="w-full gap-2!">
                <Tag
                    color={
                        email.status == "sent" ? "success" : "secondary"
                    }
                >
                    {status_title}
                </Tag>
            </Row>

            <Stack className="gap-1">
                <Span className="text-sm opacity-60">
                    Created {date_created}
                </Span>
                {sent_date ? (
                    <Span className="text-sm opacity-60">
                        Sent {sent_date}
                    </Span>
                ) : null}
            </Stack>

            <Divider />

            <Row className="w-full grid xl:grid-cols-2 gap-6">
                <Stack className="gap-1">
                    <Span className="text-xs opacity-50">
                        Recipients
                    </Span>
                    <Span className="whitespace-pre-line">
                        {email.to_emails || "-"}
                    </Span>
                </Stack>

                <Stack className="gap-1">
                    <Span className="text-xs opacity-50">
                        Attachments
                    </Span>
                    {attachments?.[0] ? (
                        <Stack className="gap-1">
                            {attachments.map((attachment, index) => (
                                <EmailAttachmentRow
                                    key={index}
                                    attachment={attachment}
                                />
                            ))}
                        </Stack>
                    ) : (
                        <Span className="opacity-60">None</Span>
                    )}
                </Stack>
            </Row>

            <Divider />

            <div
                className="w-full text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                    __html: email.body_html || "",
                }}
            />
        </Stack>
    );
}