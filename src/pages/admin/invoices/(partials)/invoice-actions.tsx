import type { BUN_SQLITE_BSQLITE_INVOICES } from "@/db/types/db";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { useState } from "react";
import { downloadGeneratedPdf } from "@/src/functions/frontend/document-actions";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import Tag from "@moduletrace/twui/elements/Tag";
import SendInvoiceEmailModal from "./send-invoice-email-modal";
import { AppContext } from "@/src/pages/__root";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import { useContext } from "react";

type Props = {
    invoice: BUN_SQLITE_BSQLITE_INVOICES;
    is_view_invoice_page?: boolean;
};

export default function InvoiceActions({
    invoice,
    is_view_invoice_page,
}: Props) {
    const { pageProps } = useContext(AppContext);
    const is_read_only = isReadOnlyUser({
        user_types: pageProps?.user_types,
    });
    const { loading, setLoading, status, setStatus } = useStatus();
    const [email_open, setEmailOpen] = useState(false);

    const edit_invoice_url = `/admin/invoices/${invoice.id}/edit`;

    const download_pdf = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await downloadGeneratedPdf({
            url: "/api/admin/invoices/generate-pdf",
            body: {
                invoice_id: invoice.id,
            },
            fallback_filename: `${invoice.invoice_number || "invoice"}.pdf`,
        });

        if (res.success) {
            setStatus({
                error: false,
                success: true,
                msg: "Invoice downloaded",
            });
        } else {
            setStatus({
                error: true,
                msg: res.msg || "Couldn't download invoice",
            });
        }

        setLoading(false);
    };

    return (
        <Row className="justify-end gap-2!">
            {status?.error && <Tag color="error">{status.msg}</Tag>}
            {status?.success && <Tag color="success">{status.msg}</Tag>}
            {is_view_invoice_page ? null : (
                <Button
                    title="View Invoice"
                    variant="ghost"
                    color="gray"
                    href={`/admin/invoices/${invoice.id}`}
                >
                    <LucideIcon name="Eye" size={16} />
                </Button>
            )}

            <Button
                title="Download Invoice PDF"
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
                        title="Send Invoice by Email"
                        variant="ghost"
                        color="secondary"
                        onClick={() => {
                            setEmailOpen(true);
                        }}
                    >
                        <LucideIcon name="MailPlus" size={16} />
                    </Button>

                    <Button
                        title="Edit Invoice"
                        variant="ghost"
                        color="gray"
                        href={edit_invoice_url}
                    >
                        <LucideIcon name="Edit2" size={16} />
                    </Button>
                </>
            )}

            <SendInvoiceEmailModal
                invoice={invoice}
                open={email_open}
                setOpen={setEmailOpen}
            />
        </Row>
    );
}
