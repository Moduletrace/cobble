import type {
    BUN_SQLITE_BSQLITE_INVOICE_ITEMS,
    BUN_SQLITE_BSQLITE_INVOICES,
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
import InvoiceActions from "./invoice-actions";
import Link from "@moduletrace/twui/layout/Link";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";

type Props = {
    invoice: BUN_SQLITE_BSQLITE_INVOICES;
};

const StatusColors = {
    draft: "gray",
    issued: "secondary",
    paid: "success",
    cancelled: "error",
} as const;

export default function InvoiceCard({ invoice }: Props) {
    const { res: items } =
        useAdminCrudGet<BUN_SQLITE_BSQLITE_INVOICE_ITEMS>({
            table: "invoice_items",
            sql_query: {
                query: {
                    invoice_id: {
                        value: invoice.id,
                    },
                },
            },
        });

    const total_kobo = sumInvoiceItemsKobo(items || []);

    const status = invoice.status || "draft";
    const status_color =
        StatusColors[status as keyof typeof StatusColors] || "gray";
    const date_created = dayjs(Number(invoice.created_at));

    const view_url = `/admin/invoices/${invoice.id}`;
    const edit_url = `/admin/invoices/${invoice.id}/edit`;

    return (
        <Card>
            <Stack className="w-full gap-2">
                <Link href={view_url} className="text-foreground-light! dark:text-foreground-dark! w-full">
                    <Row className="w-full justify-between items-start">
                        <Stack className="gap-3">
                            <H3>{invoice.title || "Invoice"}</H3>
                            <Row className="gap-1!">
                                <LucideIcon
                                    name="Building"
                                    size={15}
                                    opacity={0.5}
                                />
                                <Span size="small" variant="faded">
                                    {invoice.client_name
                                        ? `${invoice.client_name}`
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
                    <InvoiceActions invoice={invoice} />
                </Row>
            </Stack>
        </Card>
    );
}
