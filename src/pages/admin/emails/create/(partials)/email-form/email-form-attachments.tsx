import type {
    BUN_SQLITE_BSQLITE_INVOICES,
    BUN_SQLITE_BSQLITE_LETTERS,
    BUN_SQLITE_BSQLITE_QUOTES,
} from "@/db/types/db";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Select from "@moduletrace/twui/form/Select";
import Button from "@moduletrace/twui/layout/Button";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import clientUploadMediaHandler from "@/src/functions/frontend/client-upload-media-handler";
import { useAdminCrudGet } from "@/src/hooks/use-admin-crud-get";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { EmailAttachmentDraft } from "../../(utils)/email-attachment-draft";
import fileToDataUrl from "../../(utils)/file-to-data-url";
import EmailFormAttachmentRow from "./email-form-attachment-row";

type Props = {
    attachments: EmailAttachmentDraft[];
    setAttachments: Dispatch<SetStateAction<EmailAttachmentDraft[]>>;
    user_id?: number | string;
    setStatus: (status: { error: boolean; msg?: string } | undefined) => void;
};

export default function EmailFormAttachments({
    attachments,
    setAttachments,
    user_id,
    setStatus,
}: Props) {
    const { res: letters } =
        useAdminCrudGet<BUN_SQLITE_BSQLITE_LETTERS>({
            table: "letters",
        });

    const { res: invoices } =
        useAdminCrudGet<BUN_SQLITE_BSQLITE_INVOICES>({
            table: "invoices",
        });

    const { res: quotes } =
        useAdminCrudGet<BUN_SQLITE_BSQLITE_QUOTES>({
            table: "quotes",
        });

    const file_input_ref = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const attached_letter_ids = attachments
        .filter((a) => a.type == "letter" && a.letter_id)
        .map((a) => Number(a.letter_id));

    const attached_invoice_ids = attachments
        .filter((a) => a.type == "invoice" && a.invoice_id)
        .map((a) => Number(a.invoice_id));

    const attached_quote_ids = attachments
        .filter((a) => a.type == "quote" && a.quote_id)
        .map((a) => Number(a.quote_id));

    const available_letters = (letters || []).filter(
        (letter) => !attached_letter_ids.includes(Number(letter.id)),
    );

    const letter_options = [
        {
            title: "- Choose a letter -",
            value: "",
            default: true,
        },
        ...available_letters.map((letter) => ({
            title: letter.title || letter.subject || `#${letter.id}`,
            value: `${letter.id}`,
        })),
    ];

    const available_invoices = (invoices || []).filter(
        (invoice) => !attached_invoice_ids.includes(Number(invoice.id)),
    );

    const invoice_options = [
        {
            title: "- Choose an invoice -",
            value: "",
            default: true,
        },
        ...available_invoices.map((invoice) => ({
            title: invoice.invoice_number || invoice.title || `#${invoice.id}`,
            value: `${invoice.id}`,
        })),
    ];

    const available_quotes = (quotes || []).filter(
        (quote) => !attached_quote_ids.includes(Number(quote.id)),
    );

    const quote_options = [
        {
            title: "- Choose a quote -",
            value: "",
            default: true,
        },
        ...available_quotes.map((quote) => ({
            title: quote.quote_number || quote.title || `#${quote.id}`,
            value: `${quote.id}`,
        })),
    ];

    const add_letter = (letter_id: number) => {
        if (attached_letter_ids.includes(letter_id)) return;

        setAttachments((prev) => [
            ...prev,
            {
                type: "letter",
                letter_id,
            },
        ]);
    };

    const add_invoice = (invoice_id: number) => {
        if (attached_invoice_ids.includes(invoice_id)) return;

        setAttachments((prev) => [
            ...prev,
            {
                type: "invoice",
                invoice_id,
            },
        ]);
    };

    const add_quote = (quote_id: number) => {
        if (attached_quote_ids.includes(quote_id)) return;

        setAttachments((prev) => [
            ...prev,
            {
                type: "quote",
                quote_id,
            },
        ]);
    };

    const upload_files = async (files: FileList | File[]) => {
        if (!user_id) {
            setStatus({
                error: true,
                msg: `Sign in required to upload attachments`,
            });
            return;
        }

        setUploading(true);

        for (const file of Array.from(files)) {
            const { dataUrl, mimeType, name } = await fileToDataUrl({
                file,
            });

            if (!dataUrl) {
                setStatus({
                    error: true,
                    msg: `Couldn't read file: ${file.name}`,
                });
                continue;
            }

            const upload_res = await clientUploadMediaHandler({
                user_id,
                media_type: "document",
                media_base_64_data_url: dataUrl,
                media_name: (name || file.name).replace(/\.[^.]+$/, ""),
            });

            if (!upload_res.success || !upload_res.singleRes?.id) {
                setStatus({
                    error: true,
                    msg: upload_res.msg || `Couldn't upload file: ${file.name}`,
                });
                continue;
            }

            const attachment: EmailAttachmentDraft = {
                type: "file",
                media_id: Number(upload_res.singleRes.id),
                file_name: name || file.name,
                mime_type: mimeType || file.type,
            };

            setAttachments((prev) => [...prev, attachment]);
        }

        setUploading(false);

        if (file_input_ref.current) {
            file_input_ref.current.value = "";
        }
    };

    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Attachments</H3>

            {attachments[0] ? (
                <Stack className="w-full gap-2">
                    {attachments.map((attachment, index) => (
                        <EmailFormAttachmentRow
                            key={index}
                            attachment={attachment}
                            onRemove={() => {
                                setAttachments((prev) =>
                                    prev.filter((_a, i) => i !== index),
                                );
                            }}
                        />
                    ))}
                </Stack>
            ) : (
                <Span className="text-sm opacity-60">
                    No attachments - add a letter, invoice, quote, or upload
                    files below.
                </Span>
            )}

            <Row className="w-full items-center gap-2!">
                <Select
                    key={1}
                    title="Attach Letter"
                    options={letter_options}
                    showLabel
                    wrapperWrapperProps={{ className: "flex-1" }}
                    changeHandler={(value) => {
                        if (!value) return;
                        add_letter(Number(value));
                    }}
                />

                <Select
                    key={2}
                    title="Attach Invoice"
                    options={invoice_options}
                    showLabel
                    wrapperWrapperProps={{ className: "flex-1" }}
                    changeHandler={(value) => {
                        if (!value) return;
                        add_invoice(Number(value));
                    }}
                />

                <Select
                    key={3}
                    title="Attach Quote"
                    options={quote_options}
                    showLabel
                    wrapperWrapperProps={{ className: "flex-1" }}
                    changeHandler={(value) => {
                        if (!value) return;
                        add_quote(Number(value));
                    }}
                />

                <input
                    ref={file_input_ref}
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            upload_files(e.target.files);
                        }
                    }}
                />

                <Button
                    title="Upload Files"
                    variant="ghost"
                    color="secondary"
                    loading={uploading}
                    onClick={(e) => {
                        e.preventDefault();
                        file_input_ref.current?.click();
                    }}
                >
                    <LucideIcon name="Upload" size={16} />
                </Button>
            </Row>
        </Stack>
    );
}
