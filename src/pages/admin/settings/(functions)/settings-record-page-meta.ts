import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import type { SettingsRecordKind } from "@/src/utils/parse-settings-record-path";

type Params = {
    kind: SettingsRecordKind;
};

/**
 * A nested settings record page's title and description: the bot,
 * workspace or user it manages.
 */
export default function settingsRecordPageMeta({
    kind,
}: Params): BunextPageModuleMetaFn {
    return async (params) => {
        const props = params.serverRes?.props as PagePropsType | undefined;

        if (kind == "bots") {
            const bot = props?.bot;

            return {
                title: `${bot?.name || "Bot"} settings | ${SiteData["SiteName"]}`,
                description: bot?.role || `Manage this bot on ${SiteData["SiteName"]}.`,
            };
        }

        if (kind == "workspaces") {
            const workspace = props?.workspace;

            return {
                title: `${workspace?.name || "Workspace"} settings | ${SiteData["SiteName"]}`,
                description:
                    workspace?.description ||
                    `Manage this workspace on ${SiteData["SiteName"]}.`,
            };
        }

        const person = props?.target_person;
        const name =
            [person?.first_name, person?.last_name].filter(Boolean).join(" ") ||
            person?.email ||
            "User";

        return {
            title: `${name} settings | ${SiteData["SiteName"]}`,
            description: `Manage ${name} on ${SiteData["SiteName"]}.`,
        };
    };
}
