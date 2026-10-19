import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import WorkspaceOverview from "@/src/pages/admin/settings/workspaces/[workspace_id]/(sections)/workspace-overview";

export default function WorkspacePage() {
    return <WorkspaceOverview show_settings_link />;
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const workspace = (params.serverRes?.props as PagePropsType | undefined)
        ?.workspace;

    return {
        title: `${workspace?.name || "Workspace"} | ${SiteData["SiteName"]}`,
        description: workspace?.description || `A workspace.`,
    };
};
