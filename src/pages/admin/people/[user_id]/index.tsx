import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import PersonInfo from "./(sections)/person-info";
import { SiteData } from "@/src/data/site-data";

export default function PersonPage() {
    return (
        <>
            <Hero />
            <PersonInfo />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const person = (params.serverRes?.props as PagePropsType | undefined)
        ?.person;

    return {
        title: `${person?.first_name + (person?.last_name ? ` ${person.last_name}` : "")} | ${SiteData["SiteName"]}`,
        description: person?.bio || `${SiteData["SiteName"]} Personnel`,
    };
};
