import type { BUN_SQLITE_BSQLITE_EMAILS } from "@/db/types/db";
import Card from "@moduletrace/twui/elements/Card";
import Tag from "@moduletrace/twui/elements/Tag";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import dayjs from "dayjs";
import EmailActions from "./email-actions";
import Link from "@moduletrace/twui/layout/Link";

type Props = {
    email: BUN_SQLITE_BSQLITE_EMAILS;
    refresh: () => void;
};

export default function EmailCard({ email, refresh }: Props) {
    const status_title = email.status == "sent" ? "Sent" : "Draft";
    const date_created = dayjs(Number(email.sent_at || email.created_at));

    const view_url = `/admin/emails/${email.id}`;
    const edit_url = `/admin/emails/${email.id}/edit`;

    return (
        <Card>
            <Link href={view_url} className="text-foreground-light! dark:text-foreground-dark!">
                <Row className="w-full justify-between items-start">
                    <Stack className="gap-2">
                        <H3>
                            {email.title || email.subject || "Untitled Email"}
                        </H3>
                        <Row className="gap-2!">
                            <Tag
                                color={
                                    email.status == "sent"
                                        ? "success"
                                        : "secondary"
                                }
                            >
                                {status_title}
                            </Tag>
                            {email.subject ? (
                                <Tag color="gray">{email.subject}</Tag>
                            ) : null}
                            {email.to_emails ? (
                                <Tag color="gray">{email.to_emails}</Tag>
                            ) : null}
                            <Tag color="gray">{date_created.toString()}</Tag>
                        </Row>
                    </Stack>
                </Row>
            </Link>

            <EmailActions email={email} refresh={refresh} />
        </Card>
    );
}
