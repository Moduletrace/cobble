import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

/**
 * One connection's apps page names the connection in the tab and the
 * description: the breadcrumb trail can only say "Connectors".
 */
export default function settingsConnectorPageMeta(): BunextPageModuleMetaFn {
    return async (params) => {
        const props = params.serverRes?.props as PagePropsType | undefined;
        const connection = props?.connector_apps_page?.connection;
        const name = connection?.name || "Connector";

        return {
            title: `${name} apps | ${SiteData["SiteName"]}`,
            description: `The apps ${name} offers, one page at a time.`,
        };
    };
}