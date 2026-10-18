import type { PagePropsType } from "@/src/types";
import { SiteData } from "@/src/data/site-data";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import EditEmailFormSection from "./(sections)/edit-email-form-section";

export default function EditEmailPage() {
    return (
        <>
            <Hero />
            <EditEmailFormSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const email = (params.serverRes?.props as PagePropsType | undefined)
        ?.email;

    return {
        title: `Edit ${email?.title || email?.subject || "Email"} | ${SiteData["SiteName"]}`,
        description: "Edit email",
    };
};