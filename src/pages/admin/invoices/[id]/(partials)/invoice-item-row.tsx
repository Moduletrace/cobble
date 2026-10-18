import type { BUN_SQLITE_BSQLITE_INVOICE_ITEMS } from "@/db/types/db";
import Span from "@moduletrace/twui/layout/Span";
import { formatNaira } from "@/src/utils/money";

type Props = {
    item: BUN_SQLITE_BSQLITE_INVOICE_ITEMS;
};

export default function InvoiceItemRow({ item }: Props) {
    const amount_kobo =
        (Number(item.quantity) || 0) *
        (Number(item.unit_price_kobo) || 0);

    return (
        <tr className="border-b border-slate-200 dark:border-white/10">
            <td className="py-2.5 pr-3">
                <Span>{item.description}</Span>
            </td>
            <td className="py-2.5 pr-3 text-right">
                <Span>{Number(item.quantity) || 0}</Span>
            </td>
            <td className="py-2.5 text-right">
                <Span className="font-semibold">
                    {formatNaira(amount_kobo)}
                </Span>
            </td>
        </tr>
    );
}