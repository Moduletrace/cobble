import grabInvoice, {
    grabInvoiceItems,
} from "@/src/functions/backend/db/invoices/grab-invoice";
import { SiteData } from "@/src/data/site-data";
import { InvoiceEmailContent } from "@/src/functions/backend/email/document-emails";
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

        const invoice_id = body?.invoice_id;

        if (!invoice_id) {
            throw new Error(`Invoice not found`);
        }

        const invoice_res = await grabInvoice({ id: invoice_id });
        const invoice = invoice_res.singleRes;

        if (!invoice) {
            throw new Error(`Invoice not found`);
        }

        const to_email = body?.to_email || invoice.client_email;

        if (!to_email) {
            throw new Error(
                `Please provide a recipient email address`,
            );
        }

        const items_res = await grabInvoiceItems({
            invoice_id,
        });
        const items = items_res.payload || [];

        const pdf = await generateInvoicePdf({
            invoice,
            items,
        });

        const pdf_filename = `${twuiSlugify(invoice.invoice_number || "invoice")}.pdf`;

        const send_res = await sendEmail({
            to: to_email,
            subject: `Invoice ${invoice.invoice_number || ""} from ${SiteData["SiteName"]}`,
            text: `Please find attached invoice ${invoice.invoice_number || ""} for your records.`,
            content: (
                <InvoiceEmailContent
                    invoice={invoice}
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
            msg: `Invoice sent successfully to ${to_email}`,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};