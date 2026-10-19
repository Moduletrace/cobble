import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import WorkspaceDashboard from "./(sections)/workspace-dashboard";

export default function WorkspacePage() {
    return <WorkspaceDashboard />;
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const workspace = (params.serverRes?.props as PagePropsType | undefined)
        ?.workspace;

    return {
        title: `${workspace?.name || "Workspace"} | ${SiteData["SiteName"]}`,
        description: workspace?.description || `A workspace.`,
    };
};
