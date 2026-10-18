import type { BUN_SQLITE_BSQLITE_INVOICES } from "@/db/types/db";
import Modal from "@moduletrace/twui/elements/Modal";
import Tag from "@moduletrace/twui/elements/Tag";
import Input from "@moduletrace/twui/form/Input";
import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import { sendEmailRecord } from "@/src/functions/frontend/document-actions";
import { useState } from "react";

type Props = {
    invoice: BUN_SQLITE_BSQLITE_INVOICES;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function SendInvoiceEmailModal({
    invoice,
    open,
    setOpen,
}: Props) {
    const { loading, setLoading, status, setStatus } = useStatus();
    const [to_email, setToEmail] = useState(
        invoice.client_email || "",
    );

    const send_email = async () => {
        setStatus(undefined);

        if (!to_email.trim()) {
            setStatus({
                error: true,
                msg: "Please provide a recipient email address",
            });
            return;
        }

        setLoading(true);

        const res = await sendEmailRecord({
            url: "/api/admin/invoices/send-email",
            body: {
                invoice_id: invoice.id,
                to_email,
            },
        });

        if (res.success) {
            setStatus({
                error: false,
                success: true,
                msg: res.msg || "Invoice emailed",
            });
        } else {
            setStatus({
                error: true,
                msg: res.msg || "Couldn't send invoice",
            });
        }

        setLoading(false);
    };

    return (
        <Modal open={open} setOpen={setOpen}>
            <Stack className="w-full gap-4">
                <h3>Send Invoice by Email</h3>

                <p className="text-sm opacity-60">
                    {invoice.invoice_number || "Invoice"}
                    {invoice.client_name
                        ? ` - ${invoice.client_name}`
                        : ""}
                </p>

                {status?.error && <Tag color="error">{status.msg}</Tag>}
                {status?.success && <Tag color="success">{status.msg}</Tag>}

                <Input
                    title="Recipient Email"
                    type="email"
                    placeholder="Eg. resident@example.com"
                    defaultValue={to_email}
                    onChange={(e) => {
                        setToEmail(e.target.value);
                    }}
                    showLabel
                    required
                />

                <Button
                    title="Send Invoice Email"
                    loading={loading}
                    onClick={() => {
                        send_email();
                    }}
                >
                    Send Invoice Email
                </Button>
            </Stack>
        </Modal>
    );
}