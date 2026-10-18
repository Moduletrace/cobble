import type {
    BUN_SQLITE_BSQLITE_QUOTE_ITEMS,
    BUN_SQLITE_BSQLITE_QUOTES,
} from "@/db/types/db";
import Card from "@moduletrace/twui/elements/Card";
import Tag from "@moduletrace/twui/elements/Tag";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { useAdminCrudGet } from "@/src/hooks/use-admin-crud-get";
import dayjs from "dayjs";
import { formatNaira, sumInvoiceItemsKobo } from "@/src/utils/money";
import QuoteActions from "./quote-actions";
import Link from "@moduletrace/twui/layout/Link";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";

type Props = {
    quote: BUN_SQLITE_BSQLITE_QUOTES;
};

const StatusColors = {
    draft: "gray",
    sent: "secondary",
    accepted: "success",
    declined: "error",
    expired: "warning",
} as const;

export default function QuoteCard({ quote }: Props) {
    const { res: items } =
        useAdminCrudGet<BUN_SQLITE_BSQLITE_QUOTE_ITEMS>({
            table: "quote_items",
            sql_query: {
                query: {
                    quote_id: {
                        value: quote.id,
                    },
                },
            },
        });

    const total_kobo = sumInvoiceItemsKobo(items || []);

    const status = quote.status || "draft";
    const status_color =
        StatusColors[status as keyof typeof StatusColors] || "gray";
    const date_created = dayjs(Number(quote.created_at));

    const view_url = `/admin/quotes/${quote.id}`;
    const edit_url = `/admin/quotes/${quote.id}/edit`;

    return (
        <Card>
            <Stack className="w-full gap-2">
                <Link href={view_url} className="text-foreground-light! dark:text-foreground-dark! w-full">
                    <Row className="w-full justify-between items-start">
                        <Stack className="gap-3">
                            <H3>{quote.title || "Quote"}</H3>
                            <Row className="gap-1!">
                                <LucideIcon
                                    name="Building"
                                    size={15}
                                    opacity={0.5}
                                />
                                <Span size="small" variant="faded">
                                    {quote.client_name
                                        ? `${quote.client_name}`
                                        : "--"}
                                </Span>
                            </Row>
                            <Row className="gap-2!">
                                <Tag color={status_color}>
                                    {status.toUpperCase()}
                                </Tag>
                                <Tag color="gray">
                                    {date_created.toString()}
                                </Tag>
                            </Row>
                        </Stack>

                        <Stack className="gap-1">
                            <Span variant="faded" className="text-xs">
                                Total
                            </Span>
                            <Span className="font-semibold text-lg!">
                                {formatNaira(total_kobo)}
                            </Span>
                        </Stack>
                    </Row>
                </Link>

                <Row className="w-full justify-end">
                    <QuoteActions quote={quote} />
                </Row>
            </Stack>
        </Card>
    );
}