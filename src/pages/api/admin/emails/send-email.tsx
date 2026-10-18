import TurndownService from "turndown";
import { SiteData } from "@/src/data/site-data";
import grabEmail from "@/src/functions/backend/db/documents/grab-email";
import grabLetter from "@/src/functions/backend/db/documents/grab-letter";
import grabEmailAttachments from "@/src/functions/backend/db/documents/grab-email-attachments";
import grabInvoice, {
    grabInvoiceItems,
} from "@/src/functions/backend/db/invoices/grab-invoice";
import grabQuote, {
    grabQuoteItems,
} from "@/src/functions/backend/db/quotes/grab-quote";
import sendEmail from "@/src/functions/backend/email/send-email";
import generateLetterPdf from "@/src/functions/backend/pdf/letter-pdf";
import generateInvoicePdf from "@/src/functions/backend/pdf/invoice-pdf";
import userAuth from "@/src/functions/backend/auth/user-auth";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import twuiSlugify from "@moduletrace/twui/utils/slugify";
import grabDirNames from "@/src/utils/grab-dir-names";
import type { ApiReqParams } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import path from "path";

const turndown_service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
});

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

        const email_id = body.email_id;

        if (!email_id) {
            throw new Error(`Email not found`);
        }

        const email_res = await grabEmail({ id: email_id });
        const email = email_res.singleRes;

        if (!email) {
            throw new Error(`Email not found`);
        }

        if (email.status == "sent") {
            throw new Error(`This email has already been sent`);
        }

        const to_emails = (email.to_emails || "").trim();

        if (!to_emails) {
            throw new Error(
                `Please provide a recipient email address`,
            );
        }

        let attachments: {
            filename: string;
            content: Buffer;
            contentType: string;
        }[] | undefined;

        const attachments_res = await grabEmailAttachments({ email_id });
        const attachment_rows = attachments_res.payload || [];

        if (attachment_rows[0]) {
            attachments = [];

            for (const attachment of attachment_rows) {
                if (attachment.type == "letter" && attachment.letter_id) {
                    const letter_res = await grabLetter({
                        id: attachment.letter_id,
                    });
                    const letter = letter_res.singleRes;

                    if (!letter) {
                        throw new Error(`Attached letter not found`);
                    }

                    const pdf = await generateLetterPdf({
                        template: letter,
                    });

                    attachments.push({
                        filename: `${twuiSlugify(letter.title || "letter")}.pdf`,
                        content: Buffer.from(pdf),
                        contentType: "application/pdf",
                    });
                } else if (attachment.type == "invoice" && attachment.invoice_id) {
                    const invoice_res = await grabInvoice({
                        id: attachment.invoice_id,
                    });
                    const invoice = invoice_res.singleRes;

                    if (!invoice) {
                        throw new Error(`Attached invoice not found`);
                    }

                    const items_res = await grabInvoiceItems({
                        invoice_id: attachment.invoice_id,
                    });
                    const items = items_res.payload || [];

                    const pdf = await generateInvoicePdf({
                        invoice,
                        items,
                    });

                    attachments.push({
                        filename: `${twuiSlugify(invoice.invoice_number || "invoice")}.pdf`,
                        content: Buffer.from(pdf),
                        contentType: "application/pdf",
                    });
                } else if (attachment.type == "quote" && attachment.quote_id) {
                    const quote_res = await grabQuote({
                        id: attachment.quote_id,
                    });
                    const quote = quote_res.singleRes;

                    if (!quote) {
                        throw new Error(`Attached quote not found`);
                    }

                    const items_res = await grabQuoteItems({
                        quote_id: attachment.quote_id,
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

                    attachments.push({
                        filename: `${twuiSlugify(quote.quote_number || "quote")}.pdf`,
                        content: Buffer.from(pdf),
                        contentType: "application/pdf",
                    });
                } else if (attachment.media_write_path) {
                    const { DATA_DIR } = grabDirNames();

                    const media_file = Bun.file(
                        path.join(DATA_DIR, attachment.media_write_path),
                    );

                    if (!media_file.size) {
                        throw new Error(
                            `Attachment file not found: ${attachment.file_name || "untitled"}`,
                        );
                    }

                    attachments.push({
                        filename:
                            attachment.file_name ||
                            `${attachment.id || "attachment"}`,
                        content: Buffer.from(await media_file.arrayBuffer()),
                        contentType:
                            attachment.mime_type ||
                            attachment.media_mime_type ||
                            "application/octet-stream",
                    });
                }
            }

            if (!attachments[0]) {
                attachments = undefined;
            }
        }

        const plain_body = turndown_service.turndown(
            email.body_html || "",
        );

        const send_res = await sendEmail({
            to: to_emails,
            subject:
                email.subject ||
                email.title ||
                `Email from ${SiteData["SiteName"]}`,
            text: plain_body,
            content: (
                <div
                    dangerouslySetInnerHTML={{
                        __html: email.body_html || "",
                    }}
                />
            ),
            title: `${SiteData["SiteName"]}`,
            options: attachments ? { attachments } : undefined,
        });

        if (!send_res.success) {
            return send_res;
        }

        await BunSQLite.update({
            table: "emails",
            data: {
                status: "sent",
                sent_at: Date.now(),
            },
            targetId: email.id,
        });

        return {
            success: true,
            msg: `Email sent successfully to ${to_emails}`,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};