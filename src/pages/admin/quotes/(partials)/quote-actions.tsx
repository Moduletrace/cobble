import type { BUN_SQLITE_BSQLITE_QUOTES } from "@/db/types/db";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { useState } from "react";
import { downloadGeneratedPdf } from "@/src/functions/frontend/document-actions";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import Tag from "@moduletrace/twui/elements/Tag";
import SendQuoteEmailModal from "./send-quote-email-modal";
import { AppContext } from "@/src/pages/__root";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import { useContext } from "react";

type Props = {
    quote: BUN_SQLITE_BSQLITE_QUOTES;
    is_view_quote_page?: boolean;
};

export default function QuoteActions({
    quote,
    is_view_quote_page,
}: Props) {
    const { pageProps } = useContext(AppContext);
    const is_read_only = isReadOnlyUser({
        user_types: pageProps?.user_types,
    });
    const { loading, setLoading, status, setStatus } = useStatus();
    const [email_open, setEmailOpen] = useState(false);

    const edit_quote_url = `/admin/quotes/${quote.id}/edit`;

    const download_pdf = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await downloadGeneratedPdf({
            url: "/api/admin/quotes/generate-pdf",
            body: {
                quote_id: quote.id,
            },
            fallback_filename: `${quote.quote_number || "quote"}.pdf`,
        });

        if (res.success) {
            setStatus({
                error: false,
                success: true,
                msg: "Quote downloaded",
            });
        } else {
            setStatus({
                error: true,
                msg: res.msg || "Couldn't download quote",
            });
        }

        setLoading(false);
    };

    return (
        <Row className="justify-end gap-2!">
            {status?.error && <Tag color="error">{status.msg}</Tag>}
            {status?.success && <Tag color="success">{status.msg}</Tag>}
            {is_view_quote_page ? null : (
                <Button
                    title="View Quote"
                    variant="ghost"
                    color="gray"
                    href={`/admin/quotes/${quote.id}`}
                >
                    <LucideIcon name="Eye" size={16} />
                </Button>
            )}

            <Button
                title="Download Quote PDF"
                variant="ghost"
                color="gray"
                loading={loading}
                onClick={() => {
                    download_pdf();
                }}
            >
                <LucideIcon name="Download" size={16} />
            </Button>

            {is_read_only ? null : (
                <>
                    <Button
                        title="Send Quote by Email"
                        variant="ghost"
                        color="secondary"
                        onClick={() => {
                            setEmailOpen(true);
                        }}
                    >
                        <LucideIcon name="MailPlus" size={16} />
                    </Button>

                    <Button
                        title="Edit Quote"
                        variant="ghost"
                        color="gray"
                        href={edit_quote_url}
                    >
                        <LucideIcon name="Edit2" size={16} />
                    </Button>
                </>
            )}

            <SendQuoteEmailModal
                quote={quote}
                open={email_open}
                setOpen={setEmailOpen}
            />
        </Row>
    );
}