import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Hero from "./(sections)/hero";
import InvoicesListSection from "./(sections)/invoices-list-section";

export default function InvoicesPage() {
    return (
        <>
            <Hero />
            <InvoicesListSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    return {
        title: `Invoices | ${SiteData["SiteName"]}`,
        description: "Invoice generator",
    };
};