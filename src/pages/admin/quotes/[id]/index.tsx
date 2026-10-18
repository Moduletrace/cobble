import type { PagePropsType } from "@/src/types";
import { SiteData } from "@/src/data/site-data";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import QuoteViewSection from "./(sections)/quote-view-section";

export default function QuoteViewPage() {
    return (
        <>
            <Hero />
            <QuoteViewSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const quote = (params.serverRes?.props as PagePropsType | undefined)
        ?.quote;

    return {
        title: `Quote ${quote?.quote_number || ""} | ${SiteData["SiteName"]}`,
        description: "Quote details",
    };
};