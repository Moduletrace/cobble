import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Hero from "./(sections)/hero";
import QuotesListSection from "./(sections)/quotes-list-section";

export default function QuotesPage() {
    return (
        <>
            <Hero />
            <QuotesListSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    return {
        title: `Quotes | ${SiteData["SiteName"]}`,
        description: "Quote generator",
    };
};