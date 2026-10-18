import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import EditPersonFormSection from "./(sections)/edit-person-form-section";
import { SiteData } from "@/src/data/site-data";

export default function EditPersonPage() {
    return (
        <>
            <Hero />
            <EditPersonFormSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const person = (params.serverRes?.props as PagePropsType | undefined)
        ?.person;

    const person_name = `${person?.first_name + (person?.last_name ? ` ${person.last_name}` : "")}`;

    return {
        title: `Edit ${person_name} profile | ${SiteData["SiteName"]}`,
        description: person?.bio || `${SiteData["SiteName"]} Personnel`,
    };
};
