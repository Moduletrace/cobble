import type { PagePropsType } from "@/src/types";
import { SiteData } from "@/src/data/site-data";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import EditInvoiceFormSection from "./(sections)/edit-invoice-form-section";

export default function EditInvoicePage() {
    return (
        <>
            <Hero />
            <EditInvoiceFormSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const invoice = (params.serverRes?.props as PagePropsType | undefined)
        ?.invoice;

    return {
        title: `Edit Invoice ${invoice?.invoice_number || ""} | ${SiteData["SiteName"]}`,
        description: "Invoice generator",
    };
};