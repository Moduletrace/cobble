import grabInvoice, {
    grabInvoiceItems,
} from "@/src/functions/backend/db/invoices/grab-invoice";
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

        const invoice_id = body?.invoice_id;

        if (!invoice_id) {
            throw new Error(`Invoice not found`);
        }

        const invoice_res = await grabInvoice({ id: invoice_id });
        const invoice = invoice_res.singleRes;

        if (!invoice) {
            throw new Error(`Invoice not found`);
        }

        const items_res = await grabInvoiceItems({
            invoice_id,
        });

        const pdf = await generateInvoicePdf({
            invoice,
            items: items_res.payload || [],
        });

        const filename = `${twuiSlugify(invoice.invoice_number || "invoice")}.pdf`;

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