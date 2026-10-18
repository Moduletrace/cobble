import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Hero from "./(sections)/hero";
import QuoteFormSection from "./(sections)/quote-form-section";

export default function CreateQuotePage() {
    return (
        <>
            <Hero />
            <QuoteFormSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    return {
        title: `Create Quote | ${SiteData["SiteName"]}`,
        description: "Quote generator",
    };
};