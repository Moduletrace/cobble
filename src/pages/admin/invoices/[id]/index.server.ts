import grabInvoice, {
    grabInvoiceItems,
} from "@/src/functions/backend/db/invoices/grab-invoice";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const invoice_id = params.query?.id;

    if (!invoice_id) {
        return {
            redirect: {
                destination: "/admin/invoices",
            },
        };
    }

    const invoice_res = await grabInvoice({ id: invoice_id });

    if (!invoice_res.singleRes) {
        return {
            redirect: {
                destination: "/admin/invoices",
            },
        };
    }

    const items_res = await grabInvoiceItems({ invoice_id });

    return {
        props: {
            invoice: invoice_res.singleRes,
            invoice_items: items_res.payload || [],
        },
    };
};