import Tag from "@moduletrace/twui/elements/Tag";
import Section from "@moduletrace/twui/layout/Section";
import Divider from "@moduletrace/twui/layout/Divider";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import dayjs from "dayjs";
import { formatNaira, sumInvoiceItemsKobo } from "@/src/utils/money";
import InvoiceItemRow from "../(partials)/invoice-item-row";
import InvoiceActions from "../../(partials)/invoice-actions";
import PdfPreview from "@/src/components/general/pdf-preview";
import textToSafeHtml from "@/src/utils/text-to-html";

const StatusColors = {
    draft: "gray",
    issued: "secondary",
    paid: "success",
    cancelled: "error",
} as const;

export default function InvoiceViewSection() {
    const { pageProps } = useContext(AppContext);

    const invoice = pageProps?.invoice;
    const items = pageProps?.invoice_items;

    if (!invoice) return null;

    const total_kobo = sumInvoiceItemsKobo(items || []);
    const status = invoice.status || "draft";
    const status_color =
        StatusColors[status as keyof typeof StatusColors] || "gray";
    const edit_url = `/admin/invoices/${invoice.id}/edit`;

    return (
        <Section>
            <Stack className="w-full items-stretch">
                <Row className="w-full justify-between items-start">
                    <Stack className="gap-2">
                        <Row className="gap-2!">
                            <Tag color={status_color}>
                                {status.toUpperCase()}
                            </Tag>
                            {invoice.client_name ? (
                                <Tag color="gray">{invoice.client_name}</Tag>
                            ) : null}
                        </Row>
                    </Stack>

                    <InvoiceActions invoice={invoice} is_view_invoice_page />
                </Row>

                <Divider />

                <Row className="w-full grid xl:grid-cols-2 gap-6">
                    <Stack className="gap-1">
                        <Span className="text-xs opacity-50">
                            Client
                        </Span>
                        {invoice.client_name ? (
                            <Span className="font-semibold">
                                {invoice.client_name}
                            </Span>
                        ) : null}
                        {invoice.client_email ? (
                            <Span>{invoice.client_email}</Span>
                        ) : null}
                        {invoice.client_address ? (
                            <Span className="whitespace-pre-line">
                                {invoice.client_address}
                            </Span>
                        ) : null}
                    </Stack>

                    <Stack className="gap-1">
                        <Span className="text-xs opacity-50">
                            Dates
                        </Span>
                        {invoice.issue_date ? (
                            <Span>
                                Issued{" "}
                                {dayjs(Number(invoice.issue_date)).toString()}
                            </Span>
                        ) : null}
                        {invoice.due_date ? (
                            <Span>
                                Due {dayjs(Number(invoice.due_date)).toString()}
                            </Span>
                        ) : null}
                    </Stack>
                </Row>

                <Divider />

                {items?.[0] ? (
                    <Stack className="w-full gap-2">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-300 dark:border-white/20">
                                    <th className="py-2 pr-3 text-left font-semibold">
                                        Description
                                    </th>
                                    <th className="py-2 pr-3 text-right font-semibold">
                                        Qty
                                    </th>
                                    <th className="py-2 text-right font-semibold">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <InvoiceItemRow item={item} key={index} />
                                ))}
                            </tbody>
                        </table>

                        <Row className="w-full justify-end pt-2">
                            <Span className="font-semibold text-lg!">
                                Total: {formatNaira(total_kobo)}
                            </Span>
                        </Row>
                    </Stack>
                ) : null}

                {invoice.notes ? (
                    <>
                        <Divider />
                        <Stack className="gap-1">
                            <Span className="text-xs opacity-50">
                                Notes
                            </Span>
                            <div
                                className="w-full text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html: textToSafeHtml(invoice.notes),
                                }}
                            />
                        </Stack>
                    </>
                ) : null}
            </Stack>

            <PdfPreview
                url="/api/admin/invoices/generate-pdf"
                body={{ invoice_id: invoice.id }}
                download_name={`${invoice.invoice_number || "invoice"}.pdf`}
            />
        </Section>
    );
}
