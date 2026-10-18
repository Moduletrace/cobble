import { renderToStaticMarkup } from "react-dom/server";
import path from "path";
import type { FC } from "react";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import EmailTemplateContent from "./(data)/email-template-content";

export const server: BunextPageServerFn<PagePropsType> = async () => {
    try {
        const now = Date.now();
        const EmailRoot = (
            await import(path.join(process.cwd(), `src/email/root?t=${now}`))
        ).default as FC<any>;

        const html = renderToStaticMarkup(
            <EmailRoot>
                <EmailTemplateContent />
            </EmailRoot>,
        );

        return {
            props: {
                email_template_html: html,
            },
        };
    } catch (error: any) {
        return {
            props: {
                email_template_html: "",
            },
        };
    }
};