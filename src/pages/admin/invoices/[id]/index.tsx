import type { PagePropsType } from "@/src/types";
import { SiteData } from "@/src/data/site-data";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import InvoiceViewSection from "./(sections)/invoice-view-section";

export default function InvoiceViewPage() {
    return (
        <>
            <Hero />
            <InvoiceViewSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const invoice = (params.serverRes?.props as PagePropsType | undefined)
        ?.invoice;

    return {
        title: `Invoice ${invoice?.invoice_number || ""} | ${SiteData["SiteName"]}`,
        description: "Invoice details",
    };
};