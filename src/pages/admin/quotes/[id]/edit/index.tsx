import type { PagePropsType } from "@/src/types";
import { SiteData } from "@/src/data/site-data";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import EditQuoteFormSection from "./(sections)/edit-quote-form-section";

export default function EditQuotePage() {
    return (
        <>
            <Hero />
            <EditQuoteFormSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const quote = (params.serverRes?.props as PagePropsType | undefined)
        ?.quote;

    return {
        title: `Edit Quote ${quote?.quote_number || ""} | ${SiteData["SiteName"]}`,
        description: "Quote generator",
    };
};