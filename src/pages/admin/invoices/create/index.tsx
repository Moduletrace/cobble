import type { PagePropsType } from "@/src/types";
import { SiteData } from "@/src/data/site-data";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import InvoiceFormSection from "./(sections)/invoice-form-section";

export default function CreateInvoicePage() {
    return (
        <>
            <Hero />
            <InvoiceFormSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const existing_invoice = (
        params.serverRes?.props as PagePropsType | undefined
    )?.invoice;

    return {
        title: `${
            existing_invoice?.id ? "Edit" : "Create"
        } Invoice | ${SiteData["SiteName"]}`,
        description: "Invoice generator",
    };
};