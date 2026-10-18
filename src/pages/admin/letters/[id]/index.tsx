import type { PagePropsType } from "@/src/types";
import { SiteData } from "@/src/data/site-data";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import LetterViewSection from "./(sections)/letter-view-section";

export default function LetterViewPage() {
    return (
        <>
            <Hero />
            <LetterViewSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const letter = (params.serverRes?.props as PagePropsType | undefined)
        ?.letter;

    return {
        title: `${letter?.title || "Letter"} | ${SiteData["SiteName"]}`,
        description: "Letter details",
    };
};