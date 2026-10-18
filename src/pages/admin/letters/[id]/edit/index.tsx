import type { PagePropsType } from "@/src/types";
import { SiteData } from "@/src/data/site-data";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import EditLetterFormSection from "./(sections)/edit-letter-form-section";

export default function EditLetterPage() {
    return (
        <>
            <Hero />
            <EditLetterFormSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const letter = (params.serverRes?.props as PagePropsType | undefined)
        ?.letter;

    return {
        title: `Edit ${letter?.title || "Letter"} | ${SiteData["SiteName"]}`,
        description: "Edit letter",
    };
};