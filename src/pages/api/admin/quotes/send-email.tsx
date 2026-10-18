import grabQuote, {
    grabQuoteItems,
} from "@/src/functions/backend/db/quotes/grab-quote";
import { SiteData } from "@/src/data/site-data";
import { QuoteEmailContent } from "@/src/functions/backend/email/document-emails";
import sendEmail from "@/src/functions/backend/email/send-email";
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

        const to_email = body?.to_email || quote.client_email;

        if (!to_email) {
            throw new Error(
                `Please provide a recipient email address`,
            );
        }

        const items_res = await grabQuoteItems({
            quote_id,
        });
        const items = items_res.payload || [];

        const pdf = await generateInvoicePdf({
            invoice: {
                ...quote,
                invoice_number: quote.quote_number || "",
            },
            items,
            kind: "quote",
        });

        const pdf_filename = `${twuiSlugify(quote.quote_number || "quote")}.pdf`;

        const send_res = await sendEmail({
            to: to_email,
            subject: `Quotation ${quote.quote_number || ""} from ${SiteData["SiteName"]}`,
            text: `Please find attached quotation ${quote.quote_number || ""} for our proposed works.`,
            content: (
                <QuoteEmailContent
                    quote={quote}
                    items={items}
                />
            ),
            title: `${SiteData["SiteName"]}`,
            options: {
                attachments: [
                    {
                        filename: pdf_filename,
                        content: Buffer.from(pdf),
                        contentType: "application/pdf",
                    },
                ],
            },
        });

        if (!send_res.success) {
            return send_res;
        }

        return {
            success: true,
            msg: `Quotation sent successfully to ${to_email}`,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};