import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

type Params = {
    label: string;
};

export default function settingsPageMeta({
    label,
}: Params): BunextPageModuleMetaFn {
    return async (params) => {
        const person = (params.serverRes?.props as PagePropsType | undefined)
            ?.person;

        const person_name = person
            ? `${person.first_name + (person.last_name ? ` ${person.last_name}` : "")}`
            : "";

        return {
            title: `${label} Settings${person_name ? ` - ${person_name}` : ""} | ${SiteData["SiteName"]}`,
            description: `Manage your ${label.toLowerCase()} settings on ${SiteData["SiteName"]}.`,
        };
    };
}
