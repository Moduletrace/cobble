import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Hero from "./(sections)/hero";
import EmailsListSection from "./(sections)/emails-list-section";

export default function EmailsPage() {
    return (
        <>
            <Hero />
            <EmailsListSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    return {
        title: `Emails | ${SiteData["SiteName"]}`,
        description: "Email drafts and sent emails",
    };
};