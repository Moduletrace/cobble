import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

type Params = {
    label: string;
    description: string;
};

export default function backupsPageMeta({
    label,
    description,
}: Params): BunextPageModuleMetaFn {
    return async () => {
        return {
            title: `${label} | ${SiteData["SiteName"]}`,
            description,
        };
    };
}
