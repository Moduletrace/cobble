import type { BUN_SQLITE_BSQLITE_EMAILS } from "@/db/types/db";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Tag from "@moduletrace/twui/elements/Tag";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import { sendEmailRecord } from "@/src/functions/frontend/document-actions";
import clientSendEmail from "../(functions)/client-send-email";
import { AppContext } from "@/src/pages/__root";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import { useContext } from "react";

type Props = {
    email: BUN_SQLITE_BSQLITE_EMAILS;
    refresh?: () => void;
    is_single_email_page?: boolean;
};

export default function EmailActions({
    email,
    refresh,
    is_single_email_page,
}: Props) {
    const { pageProps } = useContext(AppContext);
    const is_read_only = isReadOnlyUser({
        user_types: pageProps?.user_types,
    });
    const { loading, setLoading, status, setStatus } = useStatus();

    const duplicate_url = `/admin/emails/create?from=${email.id}`;
    const view_url = `/admin/emails/${email.id}`;
    const edit_url = `/admin/emails/${email.id}/edit`;

    return (
        <>
            <Row className="w-full justify-end gap-2!">
                {is_single_email_page ? null : (
                    <Button
                        title="View Email"
                        variant="ghost"
                        color="gray"
                        href={view_url}
                    >
                        <LucideIcon name="Eye" size={16} />
                    </Button>
                )}

                {!is_read_only && email.status != "sent" ? (
                    <Button
                        title="Send Email"
                        variant="ghost"
                        color="secondary"
                        loading={loading}
                        onClick={() => {
                            clientSendEmail({
                                email,
                                setLoading,
                                refresh,
                                setStatus,
                            });
                        }}
                    >
                        <LucideIcon name="Send" size={16} />
                    </Button>
                ) : null}

                {is_read_only ? null : (
                    <>
                        <Button
                            title="Create a New Email from this Record"
                            variant="ghost"
                            color="gray"
                            href={duplicate_url}
                        >
                            <LucideIcon name="Copy" size={16} />
                        </Button>

                        <Button
                            title="Edit Email"
                            variant="ghost"
                            color="gray"
                            href={edit_url}
                        >
                            <LucideIcon name="Edit2" size={16} />
                        </Button>
                    </>
                )}
            </Row>

            {status?.error && (
                <Row className="w-full justify-end">
                    <Tag color="error">{status.msg}</Tag>
                </Row>
            )}
            {status?.success && !loading && (
                <Row className="w-full justify-end">
                    <Tag color="success">{status.msg}</Tag>
                </Row>
            )}
        </>
    );
}
