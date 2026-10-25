import sendEmail from "@/src/functions/backend/email/send-email";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import { AppData } from "@/src/data/app-data";
import rateLimit from "@/src/utils/rate-limit";
import { grabRequestIP, logError } from "@/src/functions/backend/logger";
import resolveEmailRecipient from "@/src/functions/backend/email/resolve-email-recipient";
import { ContactRequestSchema } from "@/src/schemas/contact-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import AppError from "@/src/utils/app-error";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        const limit = rateLimit({
            key: `contact:${grabRequestIP(req) || "unknown"}`,
            limit: AppData["ContactFormLimit"],
            window_ms: AppData["RateLimitWindowMinutes"] * 60 * 1000,
        });

        if (!limit.allowed) {
            throw new AppError(
                `Too many messages. Please try again later.`,
            );
        }

        const { contact } = parseWithSchema({
            schema: ContactRequestSchema,
            data: body,
        });

        const contact_recipient = process.env.CONTACT_EMAIL_RECIPIENT;

        if (!contact_recipient) {
            throw new Error(`Contact form is not configured`);
        }

        const recipient = resolveEmailRecipient({ to: contact_recipient });

        if (!recipient) {
            throw new Error(`DEV_EMAIL_RECIPIENT is not set`);
        }

        const email_component = (
            <div>
                <div>New Contact Form Submission</div>
                <h1>{contact.subject || "No Subject"}</h1>
                <div>
                    <strong>Name:</strong> {contact.name}
                </div>
                <div>
                    <strong>Email:</strong> {contact.email}
                </div>
                <div>
                    <strong>Message:</strong>
                </div>
                <div>{contact.message}</div>
            </div>
        );

        const send_mail = await sendEmail({
            content: email_component,
            to: recipient,
            subject: `New Contact Message: ${contact.subject || "No Subject"}`,
            text: `New contact message from ${contact.name} (${contact.email}): ${contact.message}`,
            title: `${SiteData["SiteName"]} Contact`,
            options: {
                priority: "high",
            },
        });

        if (!send_mail.success) {
            return send_mail;
        }

        return {
            success: true,
            msg: "Message sent successfully. We'll get back to you soon.",
        };
    } catch (error: unknown) {
        await logError({
            title: "Contact form submission failed",
            error,
            ip_address: grabRequestIP(req),
        }).catch(() => {});

        return {
            success: false,
            msg: safeErrorMessage({ error, log: false }),
        };
    }
};
