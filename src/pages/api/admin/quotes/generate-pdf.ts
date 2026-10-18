import grabQuote, {
    grabQuoteItems,
} from "@/src/functions/backend/db/quotes/grab-quote";
import generateInvoicePdf from "@/src/functions/backend/pdf/invoice-pdf";
import userAuth from "@/src/functions/backend/auth/user-auth";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import twuiSlugify from "@moduletrace/twui/utils/slugify";
import type { ApiReqParams } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async (
    params,
) => {
    try {
        const body = params.body as ApiReqParams;

        const { user, user_types } = await userAuth({ req: params.req });

        if (!user?.logged_in_status) {
            return {
                success: false,
                msg: `Unauthorized`,
                logoutUser: true,
            };
        }

        const access = checkUserAccess({
            user_types,
            includes: ["admin"],
        });

        if (!access.success) {
            return access;
        }

        const quote_id = body?.quote_id;

        if (!quote_id) {
            throw new Error(`Quote not found`);
        }

        const quote_res = await grabQuote({ id: quote_id });
        const quote = quote_res.singleRes;

        if (!quote) {
            throw new Error(`Quote not found`);
        }

        const items_res = await grabQuoteItems({
            quote_id,
        });

        const pdf = await generateInvoicePdf({
            invoice: {
                ...quote,
                invoice_number: quote.quote_number || "",
            },
            items: items_res.payload || [],
            kind: "quote",
        });

        const filename = `${twuiSlugify(quote.quote_number || "quote")}.pdf`;

        return new Response(new Uint8Array(pdf), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition":
                    `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};