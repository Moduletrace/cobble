import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Hero from "./(sections)/hero";
import LettersListSection from "./(sections)/letters-list-section";

export default function LettersPage() {
    return (
        <>
            <Hero />
            <LettersListSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    return {
        title: `Letters | ${SiteData["SiteName"]}`,
        description: "Letter templates - download as PDF or attach to emails",
    };
};