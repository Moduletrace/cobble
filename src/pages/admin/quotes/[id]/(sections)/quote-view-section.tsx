import Card from "@moduletrace/twui/elements/Card";
import Tag from "@moduletrace/twui/elements/Tag";
import H3 from "@moduletrace/twui/layout/H3";
import Section from "@moduletrace/twui/layout/Section";
import Button from "@moduletrace/twui/layout/Button";
import Divider from "@moduletrace/twui/layout/Divider";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import dayjs from "dayjs";
import { formatNaira, sumInvoiceItemsKobo } from "@/src/utils/money";
import QuoteItemRow from "../(partials)/quote-item-row";
import QuoteActions from "../../(partials)/quote-actions";
import PdfPreview from "@/src/components/general/pdf-preview";
import textToSafeHtml from "@/src/utils/text-to-html";

const StatusColors = {
    draft: "gray",
    sent: "secondary",
    accepted: "success",
    declined: "error",
    expired: "warning",
} as const;

export default function QuoteViewSection() {
    const { pageProps } = useContext(AppContext);

    const quote = pageProps?.quote;
    const items = pageProps?.quote_items;

    if (!quote) return null;

    const total_kobo = sumInvoiceItemsKobo(items || []);
    const status = quote.status || "draft";
    const status_color =
        StatusColors[status as keyof typeof StatusColors] || "gray";
    const edit_url = `/admin/quotes/${quote.id}/edit`;

    return (
        <Section>
            <Stack className="w-full items-stretch">
                <Row className="w-full justify-between items-start">
                    <Stack className="gap-2">
                        <Row className="gap-2!">
                            <Tag color={status_color}>
                                {status.toUpperCase()}
                            </Tag>
                            {quote.client_name ? (
                                <Tag color="gray">{quote.client_name}</Tag>
                            ) : null}
                        </Row>
                    </Stack>

                    <QuoteActions quote={quote} is_view_quote_page />
                </Row>

                <Divider />

                <Row className="w-full grid xl:grid-cols-2 gap-6">
                    <Stack className="gap-1">
                        <Span className="text-xs opacity-50">
                            Client
                        </Span>
                        {quote.client_name ? (
                            <Span className="font-semibold">
                                {quote.client_name}
                            </Span>
                        ) : null}
                        {quote.client_email ? (
                            <Span>{quote.client_email}</Span>
                        ) : null}
                        {quote.client_address ? (
                            <Span className="whitespace-pre-line">
                                {quote.client_address}
                            </Span>
                        ) : null}
                    </Stack>

                    <Stack className="gap-1">
                        <Span className="text-xs opacity-50">
                            Dates
                        </Span>
                        {quote.issue_date ? (
                            <Span>
                                Issued{" "}
                                {dayjs(Number(quote.issue_date)).toString()}
                            </Span>
                        ) : null}
                        {quote.valid_until ? (
                            <Span>
                                Valid Until{" "}
                                {dayjs(Number(quote.valid_until)).toString()}
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
                                    <QuoteItemRow item={item} key={index} />
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

                {quote.notes ? (
                    <>
                        <Divider />
                        <Stack className="gap-1">
                            <Span className="text-xs opacity-50">
                                Notes
                            </Span>
                            <div
                                className="w-full text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html: textToSafeHtml(quote.notes),
                                }}
                            />
                        </Stack>
                    </>
                ) : null}
            </Stack>

            <PdfPreview
                url="/api/admin/quotes/generate-pdf"
                body={{ quote_id: quote.id }}
                download_name={`${quote.quote_number || "quote"}.pdf`}
            />
        </Section>
    );
}