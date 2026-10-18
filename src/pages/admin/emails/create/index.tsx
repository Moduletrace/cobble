import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Hero from "./(sections)/hero";
import EmailFormSection from "./(sections)/email-form-section";

export default function CreateEmailPage() {
    return (
        <>
            <Hero />
            <EmailFormSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    return {
        title: `Create New Email | ${SiteData["SiteName"]}`,
        description: "Compose a new email draft",
    };
};