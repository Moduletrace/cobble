import { renderToString } from "react-dom/server";
import path from "path";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { FC, ReactNode } from "react";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import EmailClient from "./email-client";
import { SiteData } from "@/src/data/site-data";

type Params = {
    options?: Mail.Options & Partial<SMTPTransport.Options>;
    to: string;
    content: ReactNode;
    subject: string;
    text: string;
    title?: string;
};

export default async function sendEmail({
    options,
    to,
    content,
    subject,
    text,
    title,
}: Params): Promise<APIResponseObject> {
    try {
        const now = Date.now();
        const EmailRoot = (
            await import(path.join(process.cwd(), `src/email/root?t=${now}`))
        ).default as FC<any>;
        const final_component = <EmailRoot>{content}</EmailRoot>;

        const html = renderToString(final_component);

        const mail = await EmailClient.sendMail({
            from: `"${title || `${SiteData["SiteName"]} Mailer`}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
            sender: `${process.env.EMAIL_USER}`,
            ...options,
        });

        return {
            success: Boolean(mail.accepted?.[0]),
            singleRes: mail,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
}
