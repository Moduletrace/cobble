import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

/**
 * A General settings group page's title: the group, since two of them
 * would otherwise read the same.
 */
export default function settingsSectionPageMeta(): BunextPageModuleMetaFn {
    return async (params) => {
        const props = params.serverRes?.props as PagePropsType | undefined;
        const section = props?.general_section;
        const person = props?.person;
        const person_name = person
            ? `${person.first_name + (person.last_name ? ` ${person.last_name}` : "")}`
            : "";
        const label = section?.title || "General";

        return {
            title: `${label} Settings${person_name ? ` - ${person_name}` : ""} | ${SiteData["SiteName"]}`,
            description: `Read your ${label.toLowerCase()} settings on ${SiteData["SiteName"]}.`,
        };
    };
}