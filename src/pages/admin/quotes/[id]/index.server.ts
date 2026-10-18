import grabQuote, {
    grabQuoteItems,
} from "@/src/functions/backend/db/quotes/grab-quote";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const quote_id = params.query?.id;

    if (!quote_id) {
        return {
            redirect: {
                destination: "/admin/quotes",
            },
        };
    }

    const quote_res = await grabQuote({ id: quote_id });

    if (!quote_res.singleRes) {
        return {
            redirect: {
                destination: "/admin/quotes",
            },
        };
    }

    const items_res = await grabQuoteItems({ quote_id });

    return {
        props: {
            quote: quote_res.singleRes,
            quote_items: items_res.payload || [],
        },
    };
};