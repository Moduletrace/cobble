import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Hero from "./(sections)/hero";
import LetterFormSection from "./(sections)/letter-form-section";

export default function CreateLetterPage() {
    return (
        <>
            <Hero />
            <LetterFormSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    return {
        title: `Create New Letter | ${SiteData["SiteName"]}`,
        description: "Create a new letter template",
    };
};