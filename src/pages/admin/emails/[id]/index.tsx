import type { PagePropsType } from "@/src/types";
import { SiteData } from "@/src/data/site-data";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import EmailViewSection from "./(sections)/email-view-section";

export default function EmailViewPage() {
    return (
        <>
            <Hero />
            <EmailViewSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const email = (params.serverRes?.props as PagePropsType | undefined)
        ?.email;

    return {
        title: `${email?.title || email?.subject || "Email"} | ${SiteData["SiteName"]}`,
        description: "Email details",
    };
};