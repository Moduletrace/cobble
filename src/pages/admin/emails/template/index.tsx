import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Hero from "./(sections)/hero";
import EmailTemplateSection from "./(sections)/email-template-section";

export default function EmailTemplatePage() {
    return (
        <>
            <Hero />
            <EmailTemplateSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    return {
        title: `Email Template | ${SiteData["SiteName"]}`,
        description: "Live preview of the email template",
    };
};